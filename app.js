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
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
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
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      
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

  async function fetchTimeline() {
    try {
      let response = await fetch('/api/timeline');
      if (!response.ok) response = await fetch('./database/timeline.json');
      if (!response.ok) return;
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;
      
      const timelineData = await response.json();
      if (timelineData && timelineData.length > 0) {
        document.getElementById('timeline').style.display = 'block';
        initTimelineWheel(timelineData);
      }
    } catch(e) {
      console.warn("Could not load timeline", e);
    }
  }

  function initTimelineWheel(timelineData) {
    const wheel = document.getElementById('timeline-wheel');
    const activeYearEl = document.getElementById('timeline-active-year');
    const activeTitleEl = document.getElementById('timeline-active-title');
    const activeDescEl = document.getElementById('timeline-active-desc');
    const activeMediaEl = document.getElementById('timeline-media-container');

    let activeIndex = Math.floor(timelineData.length / 2);
    const angleStep = 18; 
    let currentAngleOffset = -activeIndex * angleStep;
    const radius = 300;
    const centerY = wheel.clientHeight + 50; 
    
    const dots = [];
    
    let isDragging = false;
    let startX = 0;
    let startAngleOffset = 0;
    wheel.style.cursor = 'grab';

    function handleDragStart(e) {
      if (e.target.closest('.carousel-btn')) return; // Ignore drag on buttons
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX);
      startAngleOffset = currentAngleOffset;
      wheel.style.cursor = 'grabbing';
      
      dots.forEach(dotObj => {
        dotObj.el.style.transition = 'none';
      });
      
      const line = document.getElementById('timeline-line');
      if (line) line.style.height = '0px';
      
      activeYearEl.style.opacity = '0';
      if (activeTitleEl) activeTitleEl.style.opacity = '0';
      activeDescEl.style.opacity = '0';
      if (activeMediaEl) activeMediaEl.style.opacity = '0';
    }

    function handleDragMove(e) {
      if (!isDragging) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX);
      const dx = currentX - startX;
      
      const sensitivity = 0.3; 
      currentAngleOffset = startAngleOffset + (dx * sensitivity);
      
      renderWheelAtAngle(currentAngleOffset);
    }

    function handleDragEnd() {
      if (!isDragging) return;
      isDragging = false;
      wheel.style.cursor = 'grab';
      
      dots.forEach(dotObj => {
        dotObj.el.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      });
      
      let targetIndex = Math.round(-currentAngleOffset / angleStep);
      targetIndex = Math.max(0, Math.min(timelineData.length - 1, targetIndex));
      
      activeIndex = targetIndex;
      updateWheel();
    }

    wheel.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    
    wheel.addEventListener('touchstart', handleDragStart, {passive: true});
    window.addEventListener('touchmove', handleDragMove, {passive: true});
    window.addEventListener('touchend', handleDragEnd);

    timelineData.forEach((item, index) => {
      const dotContainer = document.createElement('div');
      dotContainer.style.position = 'absolute';
      dotContainer.style.transform = 'translate(-50%, -50%)';
      dotContainer.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      dotContainer.style.cursor = 'pointer';
      dotContainer.style.textAlign = 'center';
      dotContainer.style.zIndex = '10';
      
      const dot = document.createElement('div');
      dot.style.width = '16px';
      dot.style.height = '16px';
      dot.style.background = '#555';
      dot.style.borderRadius = '50%';
      dot.style.margin = '0 auto';
      dot.style.transition = 'all 0.3s';
      
      const text = document.createElement('div');
      text.textContent = item.year;
      text.style.color = '#777';
      text.style.marginTop = '12px';
      text.style.fontSize = '1.1rem';
      text.style.transition = 'all 0.3s';
      text.style.fontFamily = 'var(--font-heading)';

      dotContainer.appendChild(dot);
      dotContainer.appendChild(text);
      wheel.appendChild(dotContainer);
      
      dotContainer.onclick = () => {
        activeIndex = index;
        updateWheel();
      };
      
      dots.push({ el: dotContainer, dot, text, data: item });
    });

    function renderWheelAtAngle(angleOffset) {
      const centerX = wheel.clientWidth / 2;
      dots.forEach((dotObj, i) => {
        const angleDeg = -90 + (i * angleStep) + angleOffset;
        const angleRad = angleDeg * (Math.PI / 180);
        
        const x = centerX + radius * Math.cos(angleRad);
        const y = centerY + radius * Math.sin(angleRad);
        
        dotObj.el.style.left = `${x}px`;
        dotObj.el.style.top = `${y}px`;
        
        const distanceToCenter = Math.abs(angleDeg + 90);
        
        if (distanceToCenter < 5) {
          dotObj.dot.style.background = 'var(--accent-color)';
          dotObj.dot.style.transform = 'scale(1.5)';
          dotObj.dot.style.boxShadow = '0 0 15px var(--accent-color)';
          dotObj.text.style.color = 'var(--accent-color)';
          dotObj.text.style.fontSize = '1.4rem';
          dotObj.text.style.fontWeight = 'bold';
          dotObj.el.style.opacity = '1';
        } else {
          dotObj.dot.style.background = '#555';
          dotObj.dot.style.transform = 'scale(1)';
          dotObj.dot.style.boxShadow = 'none';
          dotObj.text.style.color = '#777';
          dotObj.text.style.fontSize = '1.1rem';
          dotObj.text.style.fontWeight = 'normal';
          
          if (y > wheel.clientHeight - 20) {
            dotObj.el.style.opacity = '0';
            dotObj.el.style.pointerEvents = 'none';
          } else {
            dotObj.el.style.opacity = '1';
            dotObj.el.style.pointerEvents = 'auto';
          }
        }
      });
    }

    function updateWheel() {
      const line = document.getElementById('timeline-line');
      
      currentAngleOffset = -activeIndex * angleStep;
      renderWheelAtAngle(currentAngleOffset);

      const activeData = timelineData[activeIndex];
      activeYearEl.style.opacity = '0';
      if (activeTitleEl) activeTitleEl.style.opacity = '0';
      activeDescEl.style.opacity = '0';
      if (activeMediaEl) activeMediaEl.style.opacity = '0';
      
      setTimeout(() => {
        // Protrude the line back
        if (line) line.style.height = '250px';

        activeYearEl.textContent = activeData.year;
        if (activeTitleEl) activeTitleEl.textContent = activeData.title ? `- ${activeData.title}` : '';
        activeDescEl.innerHTML = activeData.content;
        
        const imgs = activeData.images || (activeData.image ? [activeData.image] : []);
        
        if (imgs.length > 0) {
          activeMediaEl.innerHTML = `
            <div class="carousel-container" id="carousel-tl-${activeIndex}" style="width: 100%; max-width: 100%; border-radius: var(--radius-md); box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; transform: translateZ(0);">
              <div class="carousel-track" style="display: flex; width: 100%; height: 100%; border-radius: var(--radius-md);">
                ${imgs.map(img => `<div class="carousel-slide" style="flex: 0 0 100%; min-width: 0; max-width: 100%; width: 100%; height: auto !important; align-self: stretch; display:flex; justify-content:center; align-items:center; overflow: hidden; border-radius: var(--radius-md);"><img src="${img}" alt="${activeData.year}" loading="lazy" style="max-height: 400px; max-width: 100%; height: auto !important; width: auto !important; object-fit: contain; border-radius: var(--radius-md); margin: auto;" /></div>`).join('')}
              </div>
              ${imgs.length > 1 ? `
                <button class="carousel-btn carousel-prev"><i class="ph ph-caret-left"></i></button>
                <button class="carousel-btn carousel-next"><i class="ph ph-caret-right"></i></button>
              ` : ''}
            </div>
          `;
          activeMediaEl.style.display = 'block';
          // Initialize just this new carousel
          initCarousels();
        } else {
          activeMediaEl.innerHTML = '';
          activeMediaEl.style.display = 'none';
        }
        
        activeYearEl.style.opacity = '1';
        if (activeTitleEl) activeTitleEl.style.opacity = '1';
        activeDescEl.style.opacity = '1';
        if (imgs.length > 0) activeMediaEl.style.opacity = '1';
      }, 300);
    }

    window.addEventListener('resize', updateWheel);
    updateWheel();
  }

  fetchProducts();
  fetchSettings();
  fetchTimeline();
});
