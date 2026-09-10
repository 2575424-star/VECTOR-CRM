package ru.vectorcrm.app

import android.app.Activity
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.Gravity
import android.view.View
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

class MainActivity : Activity() {
    companion object {
        private const val CRM_URL = "https://vector-crm-pavel.divine-lime-4457.chatgpt.site/"
        private const val ACCESS_URL = "https://raw.githubusercontent.com/2575424-star/VECTOR-CRM/main/mobile-access.json"
        private const val BUILTIN_ACCESS_HASH = "0438982148e5b62e605f5965d29eaabaac5d3a380d2ccbfce6578d3eff76be28"
        private const val PREFS = "vector_crm_access"
        private const val KEY_HASH = "access_hash"
        private const val LAST_OK = "last_ok"
        private const val OFFLINE_GRACE_MS = 24L * 60L * 60L * 1000L
        private const val FILE_CHOOSER_REQUEST = 501
    }

    private lateinit var webView: WebView
    private lateinit var status: TextView
    private lateinit var title: TextView
    private lateinit var progress: ProgressBar
    private lateinit var activateButton: Button
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val executor = Executors.newSingleThreadExecutor()
    private val prefs by lazy { getSharedPreferences(PREFS, Context.MODE_PRIVATE) }
    private var isAuthorized = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
        handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        if (isAuthorized) verifyStoredAccess(silent = true)
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(42, 42, 42, 42)
            setBackgroundColor(0xFF0B1017.toInt())
        }

        title = TextView(this).apply {
            text = "VECTOR CRM"
            textSize = 30f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 12)
        }

        status = TextView(this).apply {
            text = "Проверка доступа…"
            textSize = 17f
            setTextColor(0xFFD7DEE8.toInt())
            gravity = Gravity.CENTER
            setPadding(20, 12, 20, 26)
        }

        activateButton = Button(this).apply {
            text = "АКТИВИРОВАТЬ"
            textSize = 16f
            setTextColor(Color.WHITE)
            isAllCaps = false
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = 22f
                setColor(0xFF137CFF.toInt())
            }
            setPadding(32, 14, 32, 14)
            visibility = View.GONE
            setOnClickListener { activateBuiltInAccess() }
        }

        progress = ProgressBar(this).apply {
            isIndeterminate = true
        }

        webView = WebView(this).apply {
            visibility = View.GONE
            setBackgroundColor(0xFF0B1017.toInt())
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.userAgentString = settings.userAgentString + " VECTORCRM-Android/1.1"

            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val uri = request?.url ?: return false
                    return if (uri.scheme == "http" || uri.scheme == "https") {
                        false
                    } else {
                        try { startActivity(Intent(Intent.ACTION_VIEW, uri)) } catch (_: Exception) {}
                        true
                    }
                }
            }

            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    filePathCallback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = filePathCallback
                    return try {
                        startActivityForResult(fileChooserParams?.createIntent(), FILE_CHOOSER_REQUEST)
                        true
                    } catch (_: Exception) {
                        fileCallback = null
                        false
                    }
                }
            }

            setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
                try {
                    val request = DownloadManager.Request(Uri.parse(url))
                        .setMimeType(mimeType)
                        .addRequestHeader("User-Agent", userAgent)
                        .addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url))
                        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        .setDestinationInExternalPublicDir(
                            Environment.DIRECTORY_DOWNLOADS,
                            android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType)
                        )
                    (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(request)
                } catch (_: Exception) {}
            })
        }

        root.addView(title, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        root.addView(progress, LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        root.addView(status, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT))
        root.addView(activateButton, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply {
            setMargins(24, 8, 24, 8)
        })
        root.addView(webView, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)
    }

    private fun handleIntent(intent: Intent?) {
        val data = intent?.data
        if (data?.scheme == "vectorcrm" && data.host == "activate") {
            val token = data.getQueryParameter("token")
            if (token.isNullOrBlank()) {
                showLocked("Ссылка активации повреждена.")
            } else {
                activateToken(token)
            }
        } else {
            verifyStoredAccess(silent = false)
        }
    }

    private fun activateBuiltInAccess() {
        activateHash(BUILTIN_ACCESS_HASH)
    }

    private fun activateToken(token: String) {
        activateHash(sha256(token))
    }

    private fun activateHash(hash: String) {
        showChecking("Активация устройства…")
        executor.execute {
            val result = checkHashOnline(hash)
            runOnUiThread {
                when (result) {
                    true -> {
                        prefs.edit().putString(KEY_HASH, hash).putLong(LAST_OK, System.currentTimeMillis()).apply()
                        openCrm()
                    }
                    false -> showLocked("Ключ активации недействителен или доступ отозван.")
                    null -> showLocked("Не удалось проверить активацию. Подключите интернет и нажмите «АКТИВИРОВАТЬ» ещё раз.")
                }
            }
        }
    }

    private fun verifyStoredAccess(silent: Boolean) {
        val hash = prefs.getString(KEY_HASH, null)
        if (hash.isNullOrBlank()) {
            showLocked("Приложение ещё не активировано на этом устройстве.\nНажмите кнопку ниже — это потребуется только один раз.")
            return
        }

        if (!silent) showChecking("Проверка доступа…")
        executor.execute {
            val result = checkHashOnline(hash)
            runOnUiThread {
                when (result) {
                    true -> {
                        prefs.edit().putLong(LAST_OK, System.currentTimeMillis()).apply()
                        if (!isAuthorized) openCrm()
                    }
                    false -> revokeLocal("Доступ к VECTOR CRM отозван.")
                    null -> {
                        val lastOk = prefs.getLong(LAST_OK, 0L)
                        if (System.currentTimeMillis() - lastOk <= OFFLINE_GRACE_MS) {
                            if (!isAuthorized) openCrm()
                        } else if (!silent) {
                            showLocked("Нет связи с сервером проверки доступа. Подключите интернет.")
                        }
                    }
                }
            }
        }
    }

    private fun checkHashOnline(hash: String): Boolean? {
        var connection: HttpURLConnection? = null
        return try {
            connection = URL(ACCESS_URL + "?t=" + System.currentTimeMillis()).openConnection() as HttpURLConnection
            connection.connectTimeout = 6000
            connection.readTimeout = 6000
            connection.useCaches = false
            connection.setRequestProperty("Cache-Control", "no-cache")
            if (connection.responseCode !in 200..299) return null
            val json = connection.inputStream.bufferedReader().use { it.readText() }
            val root = JSONObject(json)
            val keys = root.optJSONArray("keys") ?: return false
            for (i in 0 until keys.length()) {
                val item = keys.getJSONObject(i)
                if (item.optString("sha256") == hash) return item.optBoolean("active", false)
            }
            false
        } catch (_: Exception) {
            null
        } finally {
            connection?.disconnect()
        }
    }

    private fun openCrm() {
        isAuthorized = true
        title.visibility = View.GONE
        progress.visibility = View.GONE
        status.visibility = View.GONE
        activateButton.visibility = View.GONE
        webView.visibility = View.VISIBLE
        if (webView.url == null) webView.loadUrl(CRM_URL)
    }

    private fun showChecking(message: String) {
        isAuthorized = false
        webView.visibility = View.GONE
        title.visibility = View.VISIBLE
        activateButton.visibility = View.GONE
        progress.visibility = View.VISIBLE
        status.visibility = View.VISIBLE
        status.text = message
    }

    private fun showLocked(message: String) {
        isAuthorized = false
        webView.stopLoading()
        webView.visibility = View.GONE
        title.visibility = View.VISIBLE
        progress.visibility = View.GONE
        status.visibility = View.VISIBLE
        activateButton.visibility = View.VISIBLE
        status.text = message
    }

    private fun revokeLocal(message: String) {
        prefs.edit().remove(KEY_HASH).remove(LAST_OK).apply()
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()
        webView.clearCache(true)
        webView.clearHistory()
        showLocked(message)
    }

    private fun sha256(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(value.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { "%02x".format(it) }
    }

    @Deprecated("Deprecated in Android")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST) {
            val result = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            fileCallback?.onReceiveValue(result)
            fileCallback = null
        }
    }

    @Deprecated("Deprecated in Android")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        executor.shutdownNow()
        webView.destroy()
        super.onDestroy()
    }
}
