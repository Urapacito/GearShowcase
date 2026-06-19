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



  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = document.getElementById("login-username").value;
    const pass = document.getElementById("login-password").value;

    try {
      let response = await fetch('/api/account');
      if (!response.ok) response = await fetch('./database/account.json');
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Account database missing or invalid");
      }
      const account = await response.json();
      
      const msgBuffer = new TextEncoder().encode(pass);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (user === account.username && hashHex === account.password) {
        const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        localStorage.setItem('uraniii_admin_auth', JSON.stringify({ expires }));
        loginOverlay.style.display = 'none';
        adminApp.style.display = 'block';
        loadData();
        loadSettings();
        window.loadTimeline();
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

  let draggedItem = null;

  function renderList() {
    listContainer.innerHTML = '';
    if (products.length === 0) {
      listContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No products found.</div>`;
      return;
    }

    products.forEach((p, index) => {
      const div = document.createElement('div');
      div.className = `list-item ${p.id === currentEditingId ? 'active' : ''}`;
      div.setAttribute('draggable', 'true');
      div.dataset.index = index;
      
      div.innerHTML = `
        <div style="pointer-events: none;">
          <div class="list-item-title">${p.name}</div>
          <div class="list-item-category">${p.category}</div>
        </div>
        <div style="pointer-events: none;">
          <i class="ph ph-list" style="font-size: 1.2rem; color: var(--text-muted);"></i>
        </div>
      `;
      div.onclick = () => editProduct(p.id);

      // Drag and Drop Events
      div.addEventListener('dragstart', function(e) {
        draggedItem = this;
        setTimeout(() => this.style.opacity = '0.4', 0);
      });

      div.addEventListener('dragend', function() {
        setTimeout(() => {
          this.style.opacity = '1';
          draggedItem = null;
        }, 0);
      });

      div.addEventListener('dragover', function(e) {
        e.preventDefault();
      });

      div.addEventListener('dragenter', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
      });

      div.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
      });

      div.addEventListener('drop', function() {
        this.classList.remove('drag-over');
        if (draggedItem !== this) {
          let fromIndex = parseInt(draggedItem.dataset.index);
          let toIndex = parseInt(this.dataset.index);
          
          const element = products.splice(fromIndex, 1)[0];
          products.splice(toIndex, 0, element);
          
          renderList();
          saveData();
          showToast("Product order updated!");
        }
      });

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
      document.getElementById(targetId).style.display = (targetId === 'tab-products' || targetId === 'tab-journey') ? 'grid' : 'block';
    };
  });

  // Settings Logic (Bio & Socials)
  var siteSettings = { bio: '', socials: {} };

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

  // --- TIMELINE LOGIC ---
  var timeline = [];
  let currentTlEditingId = null;
  let currentTlImages = [];
  let cropperInstance = null;

  const tlDescEditor = new Quill('#tl-desc-editor', {
    theme: 'snow',
    placeholder: 'Enter timeline event details...'
  });

  const tlListContainer = document.getElementById('admin-timeline-list');
  const tlForm = document.getElementById('timeline-form');
  const tlEditorContent = document.getElementById('timeline-editor-content');
  const tlEditorTitle = document.getElementById('timeline-editor-title');
  const btnAddTimeline = document.getElementById('btn-add-timeline');
  const btnDeleteTimeline = document.getElementById('btn-delete-timeline');
  const btnCancelTimeline = document.getElementById('btn-cancel-timeline');
  const btnExportTimeline = document.getElementById('btn-export-timeline');
  const btnImportTimeline = document.getElementById('btn-import-timeline');
  const fileImportTimeline = document.getElementById('file-import-timeline');

  const tlImageUpload = document.getElementById('tl-image-upload');
  const cropperModal = document.getElementById('cropper-modal');
  const cropperImage = document.getElementById('cropper-image');
  const btnRotateLeft = document.getElementById('btn-rotate-left');
  const btnRotateRight = document.getElementById('btn-rotate-right');
  const btnCancelCrop = document.getElementById('btn-cancel-crop');
  const btnSaveCrop = document.getElementById('btn-save-crop');
  const btnImportTimelineImgUrl = document.getElementById('btn-import-timeline-img-url');
  const tlImagesContainer = document.getElementById('tl-images-container');

  window.loadTimeline = async function() {
    try {
      let response = await fetch('/api/timeline');
      if (!response.ok) response = await fetch('./database/timeline.json');
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          timeline = await response.json();
        } else {
          timeline = [];
        }
        timeline.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        renderTimelineList();
      }
    } catch (e) {
      console.error("Could not load timeline:", e);
    }
  }

  async function saveTimelineData() {
    try {
      await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeline, null, 2)
      });
    } catch(err) {
      console.warn("Could not save timeline to cloud automatically.", err);
    }
  }

  function renderTimelineList() {
    tlListContainer.innerHTML = '';
    if (timeline.length === 0) {
      tlListContainer.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-muted);">No events found.</div>`;
      return;
    }

    timeline.forEach(t => {
      const div = document.createElement('div');
      div.className = `list-item ${t.id === currentTlEditingId ? 'active' : ''}`;
      div.innerHTML = `
        <div>
          <div class="list-item-title">${t.year}</div>
          <div class="list-item-category">Event</div>
        </div>
        <div>
          <i class="ph ph-caret-right"></i>
        </div>
      `;
      div.onclick = () => editTimelineEvent(t.id);
      tlListContainer.appendChild(div);
    });
  }

  function editTimelineEvent(id) {
    currentTlEditingId = id;
    const event = timeline.find(t => t.id === id);
    if (!event) return;

    tlEditorContent.style.display = 'none';
    tlForm.style.display = 'block';
    btnDeleteTimeline.style.display = 'inline-flex';
    tlEditorTitle.textContent = `Edit Event: ${event.year}`;

    document.getElementById('tl-year').value = event.year;
    document.getElementById('tl-title').value = event.title || '';
    tlDescEditor.root.innerHTML = event.content || '';
    
    currentTlImages = event.images || (event.image ? [event.image] : []);
    renderTlImages();

    renderTimelineList();
  }

  function renderTlImages() {
    tlImagesContainer.innerHTML = '';
    currentTlImages.forEach((imgSrc, idx) => {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.width = '100px';
      wrapper.style.height = '100px';
      wrapper.style.borderRadius = '8px';
      wrapper.style.overflow = 'hidden';
      wrapper.style.border = '1px solid var(--border-subtle)';

      const img = document.createElement('img');
      img.src = imgSrc;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      const btnRm = document.createElement('button');
      btnRm.innerHTML = '<i class="ph ph-x"></i>';
      btnRm.style.position = 'absolute';
      btnRm.style.top = '4px';
      btnRm.style.right = '4px';
      btnRm.style.background = 'rgba(255,0,0,0.8)';
      btnRm.style.color = '#fff';
      btnRm.style.border = 'none';
      btnRm.style.borderRadius = '4px';
      btnRm.style.cursor = 'pointer';
      btnRm.style.padding = '4px';
      
      btnRm.onclick = () => {
        currentTlImages.splice(idx, 1);
        renderTlImages();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(btnRm);
      tlImagesContainer.appendChild(wrapper);
    });
  }

  btnImportTimelineImgUrl.onclick = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      currentTlImages.push(url);
      renderTlImages();
    }
  };

  btnAddTimeline.onclick = () => {
    currentTlEditingId = null;
    tlEditorContent.style.display = 'none';
    tlForm.style.display = 'block';
    btnDeleteTimeline.style.display = 'none';
    tlEditorTitle.textContent = "Create New Timeline Event";
    tlForm.reset();
    document.getElementById('tl-title').value = '';
    tlDescEditor.root.innerHTML = '';
    currentTlImages = [];
    renderTlImages();
    renderTimelineList();
  };

  btnCancelTimeline.onclick = () => {
    tlForm.style.display = 'none';
    tlEditorContent.style.display = 'block';
    tlEditorTitle.textContent = "Edit Timeline Event";
    currentTlEditingId = null;
    renderTimelineList();
  };

  tlImageUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        cropperImage.src = evt.target.result;
        cropperModal.style.display = 'flex';
        
        if (cropperInstance) cropperInstance.destroy();
        
        setTimeout(() => {
          cropperInstance = new Cropper(cropperImage, {
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
          });
        }, 100);
      };
      reader.readAsDataURL(file);
    }
    tlImageUpload.value = '';
  };

  btnRotateLeft.onclick = () => cropperInstance && cropperInstance.rotate(-90);
  btnRotateRight.onclick = () => cropperInstance && cropperInstance.rotate(90);

  btnCancelCrop.onclick = () => {
    cropperModal.style.display = 'none';
    if (cropperInstance) cropperInstance.destroy();
  };

  btnSaveCrop.onclick = () => {
    if (cropperInstance) {
      const canvas = cropperInstance.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024
      });
      currentTlImages.push(canvas.toDataURL('image/jpeg', 0.8));
      renderTlImages();
      cropperModal.style.display = 'none';
      cropperInstance.destroy();
    }
  };

  tlForm.onsubmit = (e) => {
    e.preventDefault();
    const year = document.getElementById('tl-year').value.trim();
    if (!year) return showToast("Year is required");
    if (parseInt(year) < 0) return showToast("Year cannot be negative");

    const title = document.getElementById('tl-title').value.trim();

    const newEvent = {
      id: currentTlEditingId || 'tl-' + Date.now(),
      year: year,
      title: title,
      content: tlDescEditor.root.innerHTML,
      images: currentTlImages
    };

    if (currentTlEditingId) {
      const idx = timeline.findIndex(t => t.id === currentTlEditingId);
      if (idx !== -1) timeline[idx] = newEvent;
      showToast("Event updated!");
    } else {
      if (timeline.find(t => t.year === year)) {
        return showToast("An event for this year already exists!");
      }
      timeline.push(newEvent);
      showToast("Event created!");
    }

    timeline.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    saveTimelineData();
    editTimelineEvent(newEvent.id);
  };

  btnDeleteTimeline.onclick = () => {
    if (!currentTlEditingId) return;
    if (confirm("Are you sure you want to delete this event?")) {
      timeline = timeline.filter(t => t.id !== currentTlEditingId);
      saveTimelineData();
      btnCancelTimeline.onclick();
      showToast("Event deleted!");
    }
  };

  btnExportTimeline.onclick = () => {
    const jsonString = JSON.stringify(timeline, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", "timeline.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    URL.revokeObjectURL(url);
  };

  if(btnImportTimeline) {
      btnImportTimeline.onclick = () => fileImportTimeline.click();
  }
  if(fileImportTimeline) {
      fileImportTimeline.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const imported = JSON.parse(evt.target.result);
            if (Array.isArray(imported)) {
              timeline = imported;
              timeline.sort((a, b) => parseInt(a.year) - parseInt(b.year));
              saveTimelineData();
              renderTimelineList();
              showToast("Timeline imported!");
            } else {
              showToast("Invalid JSON format. Expected an array.");
            }
          } catch (err) {
            showToast("Error parsing JSON file.");
          }
        };
        reader.readAsText(file);
        fileImportTimeline.value = '';
      };
  }

  // Password Form
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.onsubmit = async (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('sec-current-pass').value;
      const newPass = document.getElementById('sec-new-pass').value;
      const confirmPass = document.getElementById('sec-confirm-pass').value;

      if (newPass !== confirmPass) {
        showToast("New passwords do not match!");
        return;
      }

      try {
        let response = await fetch('/api/account');
        if (!response.ok) response = await fetch('./database/account.json');
        const account = await response.json();

        // Hash current password input
        const msgBuffer = new TextEncoder().encode(currentPass);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const currentHashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        if (currentHashHex !== account.password) {
          showToast("Current password is incorrect!");
          return;
        }

        // Hash new password
        const newMsgBuffer = new TextEncoder().encode(newPass);
        const newHashBuffer = await crypto.subtle.digest('SHA-256', newMsgBuffer);
        const newHashArray = Array.from(new Uint8Array(newHashBuffer));
        const newHashHex = newHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const newAccount = { username: account.username, password: newHashHex };

        const saveRes = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAccount)
        });

        if (saveRes.ok) {
          showToast("Password updated successfully!");
          passwordForm.reset();
        } else {
          showToast("Failed to update password.");
        }
      } catch (err) {
        console.error(err);
        showToast("Error updating password.");
      }
    };
  }

  // --- STARTUP LOGIC ---
  if (checkAuth()) {
    loginOverlay.style.display = 'none';
    adminApp.style.display = 'block';
    loadData();
    loadSettings();
    if (typeof window.loadTimeline === 'function') {
      window.loadTimeline();
    }
  }
});
