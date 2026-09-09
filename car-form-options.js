// VECTOR CRM — enhanced new-car creation form.
// Only brand and model are required. Brand/model selects show popular choices first.
(() => {
  const form = document.getElementById("createCarForm");
  if (!form) return;

  const popularBrands = [
    "Mercedes-Benz", "BMW", "Toyota", "Kia", "Hyundai",
    "Changan", "Geely", "Li Auto", "Zeekr", "Nissan"
  ];

  const allBrands = [
    "AITO", "Acura", "Alfa Romeo", "Audi", "BAIC", "Bentley", "Bestune", "Buick",
    "BYD", "Cadillac", "Chery", "Chevrolet", "Chrysler", "Citroen", "Denza", "Dodge",
    "Dongfeng", "Exeed", "FAW", "Ferrari", "Fiat", "Ford", "GAC", "Genesis", "GMC",
    "Great Wall", "Haval", "Honda", "Hongqi", "Infiniti", "JAC", "Jaecoo", "Jaguar",
    "Jeep", "Jetour", "KGM", "Lada", "Land Rover", "Lexus", "Lincoln", "Lynk & Co",
    "Maserati", "Mazda", "MINI", "Mitsubishi", "Omoda", "Opel", "Peugeot", "Porsche",
    "RAM", "Renault", "Rolls-Royce", "Skoda", "Subaru", "Suzuki", "Tank", "Tesla",
    "Volkswagen", "Volvo", "Voyah", "XPeng"
  ].filter(b => !popularBrands.includes(b)).sort((a, b) => a.localeCompare(b, "ru"));

  const models = {
    "Mercedes-Benz": ["G-Class", "GLE", "GLS", "C-Class", "E-Class", "S-Class", "GLC", "CLA", "V-Class", "EQE", "A-Class", "AMG GT", "EQS", "Maybach GLS", "Maybach S-Class", "SL"],
    "BMW": ["X5", "X7", "X3", "5 Series", "3 Series", "7 Series", "X6", "X1", "iX", "M5", "2 Series", "4 Series", "8 Series", "i4", "i5", "i7", "M3", "M4", "XM"],
    "Toyota": ["Land Cruiser 300", "Camry", "RAV4", "Corolla", "Highlander", "Land Cruiser Prado", "Alphard", "Crown", "Hilux", "Sienna", "4Runner", "C-HR", "Fortuner", "GR Supra", "Prius", "Sequoia", "Tacoma", "Vellfire"],
    "Kia": ["Sportage", "Sorento", "K5", "Carnival", "Seltos", "K8", "K9", "EV6", "EV9", "Telluride", "Ceed", "Cerato", "Mohave", "Picanto", "Soul", "Stinger"],
    "Hyundai": ["Santa Fe", "Palisade", "Tucson", "Sonata", "Elantra", "Staria", "Grandeur", "Kona", "IONIQ 5", "IONIQ 6", "Avante", "Creta", "Genesis Coupe", "Venue"],
    "Changan": ["UNI-K", "UNI-V", "CS55 Plus", "CS75 Plus", "CS95", "Lamore", "Hunter Plus", "Deepal S07", "Deepal SL03", "UNI-T", "Alsvin", "CS35 Plus", "Eado Plus"],
    "Geely": ["Monjaro", "Atlas", "Coolray", "Tugella", "Emgrand", "Okavango", "Galaxy E5", "Galaxy L7", "Preface", "Geometry C", "Cityray"],
    "Li Auto": ["L7", "L9", "L6", "L8", "MEGA"],
    "Zeekr": ["001", "009", "7X", "X", "007", "MIX"],
    "Nissan": ["X-Trail", "Qashqai", "Patrol", "Pathfinder", "Altima", "Sentra", "Murano", "Navara", "Ariya", "GT-R", "Juke", "Leaf", "Note", "Serena", "Skyline"],
    "Audi": ["Q7", "Q8", "A6", "A8", "Q5", "A4", "Q3", "e-tron", "RS 6", "RS Q8", "A3", "A5", "A7", "Q4 e-tron", "Q6 e-tron"],
    "Lexus": ["RX", "LX", "NX", "ES", "GX", "LS", "LM", "UX", "RZ", "LC", "RC"],
    "Porsche": ["Cayenne", "Macan", "Panamera", "911", "Taycan", "718 Boxster", "718 Cayman"],
    "Volkswagen": ["Tiguan", "Touareg", "Teramont", "Passat", "Golf", "Jetta", "ID.4", "ID.6", "Arteon", "Multivan", "Polo"],
    "Honda": ["CR-V", "Civic", "Accord", "Pilot", "Odyssey", "HR-V", "ZR-V", "Fit", "e:NS1"],
    "Land Rover": ["Range Rover", "Range Rover Sport", "Defender", "Range Rover Velar", "Range Rover Evoque", "Discovery", "Discovery Sport"],
    "Haval": ["Dargo", "F7", "Jolion", "H9", "M6", "F7x", "H5"],
    "Chery": ["Tiggo 7 Pro Max", "Tiggo 8 Pro Max", "Tiggo 4 Pro", "Arrizo 8", "Tiggo 9", "Tiggo 7 Pro", "Tiggo 8 Pro"],
    "Tank": ["300", "500", "400", "700"],
    "BYD": ["Song Plus", "Han", "Tang", "Seal", "Dolphin", "Qin Plus", "Atto 3", "Seagull", "Song L", "Leopard 5"],
    "Volvo": ["XC90", "XC60", "XC40", "S90", "S60", "EX30", "EX90", "C40"],
    "Mazda": ["CX-5", "CX-60", "CX-9", "Mazda 3", "Mazda 6", "CX-30", "CX-50", "CX-90", "MX-5"],
    "Mitsubishi": ["Outlander", "Pajero Sport", "Eclipse Cross", "L200", "ASX", "Xpander"],
    "Ford": ["Explorer", "F-150", "Mustang", "Bronco", "Escape", "Expedition", "Ranger", "Edge", "Maverick"],
    "Chevrolet": ["Tahoe", "Traverse", "Suburban", "Camaro", "Corvette", "Equinox", "Trailblazer", "Silverado"],
    "Cadillac": ["Escalade", "XT6", "XT5", "CT5", "LYRIQ", "XT4", "CT4"],
    "Genesis": ["GV80", "G80", "GV70", "G90", "G70", "GV60"],
    "Infiniti": ["QX80", "QX60", "QX50", "Q50", "QX55"],
    "Subaru": ["Forester", "Outback", "Crosstrek", "WRX", "BRZ", "Impreza", "Ascent"],
    "Tesla": ["Model Y", "Model 3", "Model S", "Model X", "Cybertruck"]
  };

  const popularModelCount = 10;
  const fields = form.querySelector(".create-car-fields");
  fields.innerHTML = `
    <label>Марка *
      <select name="brand" id="createBrand" required></select>
    </label>
    <label>Модель *
      <select name="model" id="createModel" required disabled></select>
    </label>
    <label id="customBrandWrap" hidden>Другая марка *
      <input id="customBrand" maxlength="100" autocomplete="off" placeholder="Введите марку">
    </label>
    <label id="customModelWrap" hidden>Другая модель *
      <input id="customModel" maxlength="100" autocomplete="off" placeholder="Введите модель">
    </label>
    <label>VIN
      <input name="vin" minlength="17" maxlength="17" pattern="[A-HJ-NPR-Za-hj-npr-z0-9]{17}" autocomplete="off" title="17 латинских букв и цифр, без I, O, Q">
    </label>
    <label>Год выпуска
      <input name="year" type="number" min="1886" max="${new Date().getFullYear() + 1}" step="1">
    </label>
    <label>Комплектация
      <input name="modification" maxlength="150" placeholder="Например: AMG Line / M Sport">
    </label>
    <label>Пробег, км
      <input name="mileage" type="number" min="0" max="2147483647" step="1">
    </label>
    <label>Цена покупки, ₽
      <input name="purchase_price" type="number" min="0" max="9999999999" step="0.01">
    </label>
    <label>Статус
      <select name="status"><option value="">Не указан</option><option>В пути</option><option>Таможня</option><option>На складе</option><option>Продан</option></select>
    </label>`;

  const brandSelect = document.getElementById("createBrand");
  const modelSelect = document.getElementById("createModel");
  const customBrandWrap = document.getElementById("customBrandWrap");
  const customModelWrap = document.getElementById("customModelWrap");
  const customBrand = document.getElementById("customBrand");
  const customModel = document.getElementById("customModel");

  function addGroup(select, label, values) {
    if (!values.length) return;
    const group = document.createElement("optgroup");
    group.label = label;
    values.forEach(value => group.append(new Option(value, value)));
    select.append(group);
  }

  function fillBrands() {
    brandSelect.innerHTML = '<option value="">Выберите марку</option>';
    addGroup(brandSelect, "Популярные", popularBrands);
    addGroup(brandSelect, "Все марки — по алфавиту", allBrands);
    const other = document.createElement("optgroup");
    other.label = "Другое";
    other.append(new Option("Другая марка…", "__other__"));
    brandSelect.append(other);
  }

  function fillModels(brand) {
    modelSelect.innerHTML = '<option value="">Выберите модель</option>';
    modelSelect.disabled = !brand;
    customModelWrap.hidden = true;
    customModel.required = false;
    customModel.value = "";
    if (!brand) return;

    const list = [...(models[brand] || [])];
    if (list.length) {
      const popular = list.slice(0, popularModelCount);
      const rest = list.slice(popularModelCount).sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
      addGroup(modelSelect, "Популярные", popular);
      addGroup(modelSelect, "Все модели — по алфавиту", rest);
    }
    const other = document.createElement("optgroup");
    other.label = "Другое";
    other.append(new Option("Другая модель…", "__other__"));
    modelSelect.append(other);
  }

  fillBrands();

  brandSelect.addEventListener("change", () => {
    const isOther = brandSelect.value === "__other__";
    customBrandWrap.hidden = !isOther;
    customBrand.required = isOther;
    if (!isOther) customBrand.value = "";
    fillModels(isOther ? "" : brandSelect.value);
    if (isOther) {
      modelSelect.disabled = false;
      modelSelect.innerHTML = '<option value="__other__">Другая модель…</option>';
      customModelWrap.hidden = false;
      customModel.required = true;
      customBrand.focus();
    }
  });

  modelSelect.addEventListener("change", () => {
    const isOther = modelSelect.value === "__other__";
    customModelWrap.hidden = !isOther;
    customModel.required = isOther;
    if (!isOther) customModel.value = "";
    if (isOther) customModel.focus();
  });

  const vinInput = form.elements.vin;
  vinInput.addEventListener("input", e => { e.target.value = e.target.value.toUpperCase(); });

  form.addEventListener("submit", async e => {
    // Capture phase prevents the old stricter submit handler in app.js from running.
    e.preventDefault();
    e.stopImmediatePropagation();

    const errorBox = document.getElementById("createCarError");
    const saveButton = document.getElementById("saveCreateCar");
    const cancelButton = document.getElementById("cancelCreateCar");
    errorBox.textContent = "";

    const brand = brandSelect.value === "__other__" ? customBrand.value.trim() : brandSelect.value.trim();
    const model = modelSelect.value === "__other__" ? customModel.value.trim() : modelSelect.value.trim();
    if (!brand || !model) {
      errorBox.textContent = "Укажите марку и модель.";
      return;
    }
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form));
    const vin = (values.vin || "").trim().toUpperCase();
    if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      errorBox.textContent = "VIN должен содержать 17 латинских букв и цифр, без I, O, Q.";
      return;
    }

    const payload = { brand, model };
    if (vin) payload.vin = vin;
    if (values.year) payload.year = Number(values.year);
    if ((values.modification || "").trim()) payload.modification = values.modification.trim();
    if (values.mileage !== "") payload.mileage = Number(values.mileage);
    if (values.purchase_price !== "") payload.purchase_price = Number(values.purchase_price);
    if (values.status) payload.status = values.status;

    saveButton.disabled = cancelButton.disabled = true;
    saveButton.textContent = "Сохранение…";
    form.setAttribute("aria-busy", "true");

    try {
      if (vin) {
        const existing = await db.from("cars").select("id").ilike("vin", vin).limit(1);
        if (existing.error) throw existing.error;
        if (existing.data?.length) throw new Error("Автомобиль с таким VIN уже есть. Найдите его через поиск.");
      }

      const result = await db.from("cars").insert(payload).select("id").single();
      if (result.error) throw result.error;
      if (result.data?.id == null) throw new Error("Не получен номер новой карточки.");
      document.querySelector(".create-car-dialog")?.close();
      form.reset();
      fillBrands();
      fillModels("");
      customBrandWrap.hidden = customModelWrap.hidden = true;
      openCar(result.data.id);
    } catch (error) {
      errorBox.textContent = "Автомобиль не создан. " + (error.message || "Нет связи с базой.");
    } finally {
      saveButton.disabled = cancelButton.disabled = false;
      saveButton.textContent = "Сохранить и открыть";
      form.removeAttribute("aria-busy");
    }
  }, true);
})();
