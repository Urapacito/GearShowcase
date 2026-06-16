document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  const productListEl = document.getElementById("product-list");

  // Fetch product data
  async function fetchProducts() {
    try {
      const localData = localStorage.getItem('aura_products');
      if (localData) {
        const products = JSON.parse(localData);
        renderProducts(products);
        initAnimations();
        initCarousels();
        return;
      }

      const response = await fetch('./products.json');
      if (!response.ok) throw new Error("Network response was not ok");
      const products = await response.json();
      renderProducts(products);
      initAnimations();
      initCarousels();
    } catch (error) {
      console.error("Failed to fetch products:", error);
      productListEl.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Unable to load collection at this time.</p>`;
    }
  }

  function renderProducts(products) {
    productListEl.innerHTML = products.map((product) => `
      <article class="product-row" id="${product.id}">
        <div class="product-media">
          ${product.modelUrl 
            ? `<model-viewer src="${product.modelUrl}" auto-rotate camera-controls shadow-intensity="1" interaction-prompt="hover"></model-viewer>`
            : `<div class="carousel-container" id="carousel-${product.id}">
                 <div class="carousel-track">
                   ${(product.images || [product.imageUrl]).map(img => `<div class="carousel-slide"><img src="${img}" alt="${product.name}" loading="lazy" /></div>`).join('')}
                 </div>
                 ${(product.images && product.images.length > 1) ? `
                   <button class="carousel-btn carousel-prev"><i class="ph ph-caret-left"></i></button>
                   <button class="carousel-btn carousel-next"><i class="ph ph-caret-right"></i></button>
                 ` : ''}
               </div>`
          }
        </div>
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">$${product.price.toFixed(2)}</p>
          <p class="product-desc">${product.description}</p>
          
          <div class="tech-specs">
            ${product.specs.map(spec => `
              <div class="spec-item">
                <span class="spec-key">${spec.key}</span>
                <span class="spec-value">${spec.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </article>
    `).join('');
  }

  function initAnimations() {
    // Hero Animations
    gsap.from(".hero-content > *", {
      y: 50,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
      delay: 0.2
    });

    // Navbar animation
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      lastScrollY = window.scrollY;
    });

    // Product Scroll Animations
    const productRows = document.querySelectorAll('.product-row');
    
    productRows.forEach((row) => {
      gsap.to(row, {
        scrollTrigger: {
          trigger: row,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out"
      });
    });
  }

  function initCarousels() {
    document.querySelectorAll('.carousel-container').forEach(container => {
      const track = container.querySelector('.carousel-track');
      const slides = Array.from(track.children);
      if (slides.length <= 1) return;

      const nextBtn = container.querySelector('.carousel-next');
      const prevBtn = container.querySelector('.carousel-prev');
      let currentIndex = 0;
      let interval;

      const updateSlide = () => {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
      };

      const nextSlide = () => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateSlide();
      };

      const prevSlide = () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateSlide();
      };

      const resetInterval = () => {
        clearInterval(interval);
        interval = setInterval(nextSlide, 4000);
      };

      if (nextBtn) {
        nextBtn.onclick = () => { nextSlide(); resetInterval(); };
        prevBtn.onclick = () => { prevSlide(); resetInterval(); };
      }

      resetInterval();
    });
  }

  fetchProducts();
});
