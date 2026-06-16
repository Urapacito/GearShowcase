document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  const productListEl = document.getElementById("product-list");

  // Fetch product data
  async function fetchProducts() {
    try {
      let response = await fetch('/api/products');
      if (!response.ok) {
        response = await fetch('./database/products.json');
      }
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

  async function fetchSettings() {
    try {
      let response = await fetch('/api/settings');
      if (!response.ok) response = await fetch('./database/settings.json');
      if (!response.ok) return;
      
      const settings = await response.json();
      
      const bioEl = document.getElementById("bio-container");
      if (bioEl && settings.bio) {
        bioEl.innerHTML = `<h2 class="section-title">About Me</h2><div style="text-align: left; display: inline-block;">${settings.bio}</div>`;
      } else if (bioEl) {
        document.getElementById("aboutme").style.display = 'none';
      }

      const socialsEl = document.getElementById("socials-container");
      if (socialsEl && settings.socials) {
        let socialsHtml = '';
        const s = settings.socials;
        
        const cardStyle = `display: flex; align-items: center; background: #1a1a1c; border-radius: 12px; padding: 12px 20px 12px 12px; text-decoration: none; color: #fff; font-weight: 600; width: 260px; font-size: 0.95rem; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s, background 0.2s;`;
        const hoverCss = `this.style.background='#222225';this.style.transform='translateY(-2px)'`;
        const outCss = `this.style.background='#1a1a1c';this.style.transform='translateY(0)'`;
        
        const getIcon = (bg, icon) => `<div style="background: ${bg}; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 1.5rem;"><i class="${icon}"></i></div>`;
        const getArrow = () => `<i class="ph ph-arrow-up-right" style="margin-left: auto; color: #666; font-size: 1.1rem;"></i>`;

        if (s.discord) socialsHtml += `<a href="${s.discord}" target="_blank" style="${cardStyle}" onmouseover="${hoverCss}" onmouseout="${outCss}">${getIcon('#5865F2', 'ph-fill ph-discord-logo')} DISCORD ${getArrow()}</a>`;
        if (s.facebook) socialsHtml += `<a href="${s.facebook}" target="_blank" style="${cardStyle}" onmouseover="${hoverCss}" onmouseout="${outCss}">${getIcon('#1877F2', 'ph-fill ph-facebook-logo')} FACEBOOK ${getArrow()}</a>`;
        if (s.youtube) socialsHtml += `<a href="${s.youtube}" target="_blank" style="${cardStyle}" onmouseover="${hoverCss}" onmouseout="${outCss}">${getIcon('#FF0000', 'ph-fill ph-youtube-logo')} YOUTUBE ${getArrow()}</a>`;
        if (s.instagram) socialsHtml += `<a href="${s.instagram}" target="_blank" style="${cardStyle}" onmouseover="${hoverCss}" onmouseout="${outCss}">${getIcon('#E1306C', 'ph-fill ph-instagram-logo')} INSTAGRAM ${getArrow()}</a>`;
        if (s.email) socialsHtml += `<a href="mailto:${s.email}" style="${cardStyle}" onmouseover="${hoverCss}" onmouseout="${outCss}">${getIcon('#EA4335', 'ph-fill ph-envelope')} EMAIL ${getArrow()}</a>`;
        
        if (socialsHtml) {
          socialsEl.innerHTML = socialsHtml;
        } else {
          document.getElementById("contact").style.display = 'none';
        }
      }
    } catch(e) {
      console.warn("Could not load settings");
    }
  }

  fetchProducts();
  fetchSettings();
});
