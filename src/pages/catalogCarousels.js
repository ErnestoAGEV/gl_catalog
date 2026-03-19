/**
 * catalogCarousels.js
 * Gestión de carruseles de imágenes:
 *   - initCarousels()       → carruseles en las tarjetas del grid
 *   - initModalCarousel()   → carrusel con thumbs, dots y touch-swipe del modal de detalle
 *   - initModalZoom()       → zoom en hover (desktop) y pinch-to-zoom (mobile) del modal
 */

// ── Grid card carousels ──────────────────────────────────────────────────────

/**
 * Inicializa todos los carruseles de tarjetas presentes en el grid.
 * @param {NodeList} carousels - elementos [data-carousel]
 */
export function initCarousels(carousels) {
  carousels.forEach(carousel => {
    const track = carousel.querySelector('[data-track]')
    const slides = carousel.querySelectorAll('[data-slide]')
    const prevBtn = carousel.querySelector('[data-prev]')
    const nextBtn = carousel.querySelector('[data-next]')
    const dots = carousel.querySelectorAll('[data-dot]')

    let currentIndex = 0

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`
      dots.forEach((dot, i) => {
        if (i === currentIndex) {
          dot.classList.add('bg-white')
          dot.classList.remove('bg-white/60')
        } else {
          dot.classList.remove('bg-white')
          dot.classList.add('bg-white/60')
        }
      })
    }

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      currentIndex = (currentIndex - 1 + slides.length) % slides.length
      updateCarousel()
    })

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      currentIndex = (currentIndex + 1) % slides.length
      updateCarousel()
    })

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        currentIndex = i
        updateCarousel()
      })
    })
  })
}

// ── Modal carousel (thumbnails + dots + counter + touch swipe) ───────────────

/**
 * Inicializa el carrusel del modal de quick-view.
 * @param {HTMLElement} modalCarousel - elemento [data-modal-carousel]
 */
export function initModalCarousel(modalCarousel) {
  if (!modalCarousel) return

  const track = modalCarousel.querySelector('[data-modal-track]')
  const slides = modalCarousel.querySelectorAll('[data-modal-slide]')
  const prevBtn = modalCarousel.querySelector('[data-modal-prev]')
  const nextBtn = modalCarousel.querySelector('[data-modal-next]')
  const thumbs = modalCarousel.querySelectorAll('[data-modal-thumb]')
  const dots = modalCarousel.querySelectorAll('[data-modal-dot]')
  const counter = modalCarousel.querySelector('[data-modal-counter]')

  let currentIndex = 0

  const updateModalCarousel = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`
    thumbs.forEach((thumb, i) => {
      if (i === currentIndex) {
        thumb.classList.remove('border-white/40')
        thumb.classList.add('border-white')
      } else {
        thumb.classList.remove('border-white')
        thumb.classList.add('border-white/40')
      }
    })
    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.remove('bg-white/50')
        dot.classList.add('bg-white', 'shadow-md')
      } else {
        dot.classList.remove('bg-white', 'shadow-md')
        dot.classList.add('bg-white/50')
      }
    })
    if (counter) counter.textContent = `${currentIndex + 1} / ${slides.length}`
  }

  prevBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    currentIndex = (currentIndex - 1 + slides.length) % slides.length
    updateModalCarousel()
  })

  nextBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    currentIndex = (currentIndex + 1) % slides.length
    updateModalCarousel()
  })

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      currentIndex = i
      updateModalCarousel()
    })
  })

  // Touch swipe
  let touchStartX = 0
  let touchStartY = 0
  let isSwiping = false

  modalCarousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    isSwiping = false
  }, { passive: true })

  modalCarousel.addEventListener('touchmove', (e) => {
    const diffX = Math.abs(e.touches[0].clientX - touchStartX)
    const diffY = Math.abs(e.touches[0].clientY - touchStartY)
    if (diffX > diffY && diffX > 10) {
      isSwiping = true
      e.preventDefault()
    }
  }, { passive: false })

  modalCarousel.addEventListener('touchend', (e) => {
    if (!isSwiping) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (Math.abs(diff) > 40) {
      if (diff > 0 && currentIndex < slides.length - 1) {
        currentIndex++
      } else if (diff < 0 && currentIndex > 0) {
        currentIndex--
      }
      updateModalCarousel()
    }
  }, { passive: true })
}

// ── Modal image zoom (desktop hover + mobile pinch) ──────────────────────────

/**
 * Inicializa el zoom de imágenes en el modal de quick-view.
 * - En el carrusel multi-imagen, aplica zoom solo al slide activo.
 * - Al navegar entre slides, resetea el zoom del slide anterior.
 * @param {HTMLElement} modalContainer - contenedor del modal
 */
export function initModalZoom(modalContainer) {
  const imageContainers = [
    modalContainer.querySelector('[data-modal-carousel]'),
    modalContainer.querySelector('[data-modal-single]'),
  ].filter(Boolean)

  imageContainers.forEach(container => {
    if (!container) return

    const track    = container.querySelector('[data-modal-track]')
    const allImgs  = container.querySelectorAll('.modal-img-zoomable')
    let isZoomLocked = false

    // Devuelve la imagen del slide activo.
    // Para carrusel: lee el translateX del track para saber qué index está visible.
    // Para imagen única: devuelve la única imagen.
    const getActiveImg = () => {
      if (!track) return allImgs[0] || null
      const match = track.style.transform.match(/translateX\(-?([0-9.]+)%\)/)
      const idx   = match ? Math.round(parseFloat(match[1]) / 100) : 0
      return allImgs[idx] || allImgs[0] || null
    }

    // Resetea el zoom de todas las imágenes (se llama al navegar o al salir)
    const resetZoom = (exceptImg = null) => {
      allImgs.forEach(img => {
        if (img === exceptImg) return
        img.style.transform = 'scale(1)'
        img.style.transformOrigin = 'center'
      })
    }

    // Desktop: hover + mousemove zoom
    const handleMouseMove = (e) => {
      const img = getActiveImg()
      if (!img) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      img.style.transformOrigin = `${x}% ${y}%`
      if (!isZoomLocked) {
        img.style.transform = 'scale(1.5)'
        container.style.cursor = 'zoom-out'
      }
    }

    const handleMouseLeave = () => {
      if (isZoomLocked) return
      const img = getActiveImg()
      if (img) {
        img.style.transform = 'scale(1)'
        img.style.transformOrigin = 'center'
      }
      container.style.cursor = 'zoom-in'
    }

    const handleClick = (e) => {
      if (e.target.closest('[data-modal-prev], [data-modal-next], [data-modal-thumb]')) return
      const img = getActiveImg()
      if (!img) return
      isZoomLocked = !isZoomLocked
      if (isZoomLocked) {
        container.style.cursor = 'grab'
      } else {
        img.style.transform = 'scale(1)'
        img.style.transformOrigin = 'center'
        container.style.cursor = 'zoom-in'
      }
    }

    if (window.innerWidth >= 768) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
      container.addEventListener('click', handleClick)
    }

    // Resetear zoom al navegar entre slides (prev / next / thumbs)
    const navBtns = container.querySelectorAll('[data-modal-prev], [data-modal-next], [data-modal-thumb]')
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isZoomLocked = false
        container.style.cursor = 'zoom-in'
        // Pequeño delay para que updateModalCarousel mueva el track primero
        requestAnimationFrame(() => resetZoom())
      })
    })

    // Mobile: pinch-to-zoom
    let initialDistance = 0
    let initialScale    = 1

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const t1 = e.touches[0], t2 = e.touches[1]
        initialDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const img = getActiveImg()
        if (img) {
          const match = img.style.transform.match(/scale\(([^)]+)\)/)
          initialScale = match ? parseFloat(match[1]) : 1
        }
      }
    }, { passive: false })

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        e.stopPropagation()
        const t1 = e.touches[0], t2 = e.touches[1]
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const scale = Math.max(1, Math.min(3, initialScale * (currentDistance / initialDistance)))
        const img = getActiveImg()
        if (img) {
          img.style.transform = `scale(${scale})`
          container.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in'
        }
      }
    }, { passive: false })

    container.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) initialDistance = 0
    }, { passive: true })
  })
}

