document.addEventListener("DOMContentLoaded", () => {
  let products = [];
  let currentEditingId = null;
  let currentImages = [];

  const listContainer = document.getElementById("admin-product-list");
  const form = document.getElementById("product-form");
  const editorContent = document.getElementById("editor-content");
  const editorTitle = document.getElementById("editor-title");
  const specsContainer = document.getElementById("specs-container");
  
  const btnExport = document.getElementById("btn-export");
  const btnImportTemplate = document.getElementById("btn-import-template");
  const btnImport = document.getElementById("btn-import");
  const fileImport = document.getElementById("file-import");
  const btnAddNew = document.getElementById("btn-add-new");
  const btnDelete = document.getElementById("btn-delete");
  const btnCancel = document.getElementById("btn-cancel");
  const btnAddSpec = document.getElementById("btn-add-spec");
  
  const uploadInput = document.getElementById("prod-image-upload");
  const urlInput = document.getElementById("prod-image-url");
  const btnAddUrl = document.getElementById("btn-add-image-url");
  const imagesContainer = document.getElementById("images-container");
  const toastContainer = document.getElementById("toast-container");

  function showToast(message) {
    if (!toastContainer) return alert(message);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Auth logic
  const loginOverlay = document.getElementById("login-overlay");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const btnLogout = document.getElementById("btn-logout");

  function checkAuth() {
    try {
      const authData = JSON.parse(localStorage.getItem('uraniii_admin_auth'));
      if (authData && authData.expires > Date.now()) {
        return true;
      }
    } catch(e) {}
    return false;
  }

  if (checkAuth()) {
    loginOverlay.style.display = 'none';
    adminApp.style.display = 'block';
    loadData();
    loadSettings();
  }

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById("login-username").value;
    const pass = document.getElementById("login-password").value;

    try {
      const response = await fetch('./database/account.json');
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Account database missing or invalid");
      }
      const account = await response.json();
      
      if (user === account.username && pass === account.password) {
        const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem('uraniii_admin_auth', JSON.stringify({ expires }));
        loginOverlay.style.display = 'none';
        adminApp.style.display = 'block';
        loadData();
        loadSettings();
        showToast("Logged in successfully!");
      } else {
        showToast("Invalid username or password.");
      }
    } catch (err) {
      showToast("Could not verify credentials.");
      console.error(err);
    }
  };

  if (btnLogout) {
    btnLogout.onclick = () => {
      localStorage.removeItem('uraniii_admin_auth');
      window.location.reload();
    };
  }

  async function loadData() {
    try {
      let response = await fetch('/api/products');
      if (!response.ok) {
        response = await fetch('./database/products.json');
      }
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          products = await response.json();
        } else {
          products = [];
        }
        renderList();
      }
    } catch (e) {
      console.error("Could not load initial products:", e);
    }
  }

  async function saveData() {
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products, null, 2)
      });
    } catch(err) {
      console.warn("Could not save to cloud automatically.", err);
    }
  }

  function renderList() {
    listContainer.innerHTML = '';
    if (products.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No products found.</div>`;
      return;
    }

    products.forEach(p => {
      const div = document.createElement('div');
      div.className = `list-item ${p.id === currentEditingId ? 'active' : ''}`;
      div.innerHTML = `
        <div>
          <div class="list-item-title">${p.name}</div>
          <div class="list-item-category">${p.category}</div>
        </div>
        <div>
          <i class="ph ph-caret-right"></i>
        </div>
      `;
      div.onclick = () => editProduct(p.id);
      listContainer.appendChild(div);
    });
  }

  function editProduct(id) {
    currentEditingId = id;
    const product = products.find(p => p.id === id);
    if (!product) return;

    editorContent.style.display = 'none';
    form.style.display = 'block';
    btnDelete.style.display = 'inline-flex';
    editorTitle.textContent = `Edit: ${product.name}`;

    document.getElementById('prod-id').value = product.id;
    // Disable ID editing for existing products to prevent reference issues
    document.getElementById('prod-id').disabled = true; 
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.price;
    descEditor.root.innerHTML = product.description || '';
    
    currentImages = product.images || (product.imageUrl ? [product.imageUrl] : []);
    renderImages();
    
    document.getElementById('prod-model').value = product.modelUrl || '';

    renderSpecsForm(product.specs || []);
    renderList();
  }

  function renderSpecsForm(specs) {
    specsContainer.innerHTML = '';
    specs.forEach((spec) => {
      addSpecRow(spec.key, spec.value);
    });
  }

  function addSpecRow(key = '', value = '') {
    const row = document.createElement('div');
    row.className = 'spec-row';
    row.innerHTML = `
      <input type="text" placeholder="Spec Name (e.g. DAC)" class="spec-k" value="${key}" required>
      <input type="text" placeholder="Value" class="spec-v" value="${value}" required>
      <button type="button" class="btn btn-danger btn-remove-spec"><i class="ph ph-x"></i></button>
    `;
    
    row.querySelector('.btn-remove-spec').onclick = () => row.remove();
    specsContainer.appendChild(row);
  }

  btnAddSpec.onclick = () => addSpecRow();

  btnAddNew.onclick = () => {
    currentEditingId = null;
    editorContent.style.display = 'none';
    form.style.display = 'block';
    btnDelete.style.display = 'none';
    editorTitle.textContent = "Create New Product";
    form.reset();
    document.getElementById('prod-id').disabled = false;
    currentImages = [];
    renderImages();
    specsContainer.innerHTML = '';
    addSpecRow();
    renderList();
  };

  btnCancel.onclick = () => {
    form.style.display = 'none';
    editorContent.style.display = 'block';
    editorTitle.textContent = "Edit Product";
    currentEditingId = null;
    currentImages = [];
    renderList();
  };

  // Quill Editors & Tabs
  const descEditor = new Quill('#prod-desc-editor', {
    theme: 'snow',
    placeholder: 'Enter product description...'
  });
  const bioEditor = new Quill('#bio-editor', {
    theme: 'snow',
    placeholder: 'Write your bio here...'
  });

  const tabs = document.querySelectorAll('.btn-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId).style.display = targetId === 'tab-products' ? 'grid' : 'block';
    };
  });

  // Settings Logic (Bio & Socials)
  let siteSettings = { bio: '', socials: {} };

  async function loadSettings() {
    try {
      let response = await fetch('/api/settings');
      if (!response.ok) response = await fetch('./database/settings.json');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          siteSettings = await response.json();
        } else {
          siteSettings = { bio: '', socials: {} };
        }
        bioEditor.root.innerHTML = siteSettings.bio || '';
        if (siteSettings.socials) {
          document.getElementById('social-discord').value = siteSettings.socials.discord || '';
          document.getElementById('social-facebook').value = siteSettings.socials.facebook || '';
          document.getElementById('social-youtube').value = siteSettings.socials.youtube || '';
          document.getElementById('social-instagram').value = siteSettings.socials.instagram || '';
          document.getElementById('social-email').value = siteSettings.socials.email || '';
        }
      }
    } catch(e) {
      console.warn("Could not load settings", e);
    }
  }

  async function saveSettings() {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteSettings, null, 2)
      });
      showToast("Settings saved successfully!");
    } catch(err) {
      showToast("Error saving settings.");
      console.error(err);
    }
  }

  document.getElementById('btn-save-bio').onclick = () => {
    siteSettings.bio = bioEditor.root.innerHTML;
    saveSettings();
  };

  document.getElementById('btn-save-socials').onclick = () => {
    siteSettings.socials = {
      discord: document.getElementById('social-discord').value.trim(),
      facebook: document.getElementById('social-facebook').value.trim(),
      youtube: document.getElementById('social-youtube').value.trim(),
      instagram: document.getElementById('social-instagram').value.trim(),
      email: document.getElementById('social-email').value.trim()
    };
    saveSettings();
  };

  // Image Handling
  function renderImages() {
    imagesContainer.innerHTML = '';
    currentImages.forEach((img, idx) => {
      const div = document.createElement('div');
      div.style = "position: relative; width: 80px; height: 80px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-subtle);";
      div.innerHTML = `
        <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" style="position: absolute; top:2px; right:2px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items:center; justify-content:center; font-size: 10px;" onclick="removeImage(${idx})">X</button>
      `;
      imagesContainer.appendChild(div);
    });
  }

  window.removeImage = function(idx) {
    currentImages.splice(idx, 1);
    renderImages();
  };

  btnAddUrl.onclick = () => {
    const val = urlInput.value.trim();
    if (val) {
      currentImages.push(val);
      urlInput.value = '';
      renderImages();
    }
  };

  uploadInput.onchange = (e) => {
    const files = e.target.files;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        currentImages.push(evt.target.result);
        renderImages();
      };
      reader.readAsDataURL(file);
    });
    uploadInput.value = '';
  };

  form.onsubmit = (e) => {
    e.preventDefault();

    const id = document.getElementById('prod-id').value.trim();
    const name = document.getElementById('prod-name').value.trim();
    
    if (!id || !name) return showToast("ID and Name are required");

    // Gather specs
    const specs = [];
    document.querySelectorAll('.spec-row').forEach(row => {
      const k = row.querySelector('.spec-k').value.trim();
      const v = row.querySelector('.spec-v').value.trim();
      if (k && v) specs.push({ key: k, value: v });
    });

    const newProduct = {
      id: id,
      name: name,
      category: document.getElementById('prod-category').value.trim(),
      price: parseFloat(document.getElementById('prod-price').value),
      description: descEditor.root.innerHTML,
      images: currentImages,
      modelUrl: document.getElementById('prod-model').value.trim(),
      specs: specs
    };

    if (currentEditingId) {
      const idx = products.findIndex(p => p.id === currentEditingId);
      if (idx !== -1) products[idx] = newProduct;
      showToast("Product updated successfully!");
    } else {
      // Check for duplicate ID
      if (products.find(p => p.id === id)) {
        return showToast("Product ID must be unique!");
      }
      products.push(newProduct);
      showToast("Product added successfully!");
    }

    saveData();
    editProduct(newProduct.id); // Stay on the edited product
  };

  btnDelete.onclick = () => {
    if (!currentEditingId) return;
    if (confirm("Are you sure you want to delete this product?")) {
      products = products.filter(p => p.id !== currentEditingId);
      saveData();
      btnCancel.onclick();
      showToast("Product deleted successfully!");
    }
  };

  btnExport.onclick = () => {
    const jsonString = JSON.stringify(products, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "products.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  if (btnImport) {
    btnImport.onclick = () => fileImport.click();
  }

  if (fileImport) {
    fileImport.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const importedProducts = JSON.parse(evt.target.result);
          if (Array.isArray(importedProducts)) {
            products = importedProducts;
            saveData();
            renderList();
            showToast("Database imported successfully!");
          } else {
            showToast("Invalid JSON format. Expected an array of products.");
          }
        } catch (err) {
          showToast("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
      fileImport.value = ''; // reset
    };
  }

  if (btnImportTemplate) {
    btnImportTemplate.onclick = () => {
      const template = [
        {
          "id": "example-product",
          "name": "Example Product",
          "category": "Category",
          "price": 99.99,
          "description": "Description goes here.",
          "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
          "modelUrl": "",
          "specs": [
            { "key": "Spec 1", "value": "Value 1" }
          ]
        }
      ];
      const jsonString = JSON.stringify(template, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", "template.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url);
    };
  }
});
