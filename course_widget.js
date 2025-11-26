(function (global) {
  /**
   * Base endpoint for course queries
   */

  const DEFAULT_BASE_URL = 'https://onbeat.dance/api/get_courses';
  
  
const INLINE_TEMPLATE_HTML = `
<template id="course-card-template">
  <section class="onbeat-widget-course">
    <div class="onbeat-widget-course__content">
      <h2 class="onbeat-widget-course__title"></h2>
      <p class="onbeat-widget-course__start"></p>
      <p class="onbeat-widget-course__opening"></p>
      <p class="onbeat-widget-course__closing"></p>
      <p class="onbeat-widget-course__description"></p>
    </div>
    <div class="onbeat-widget-course__footer">
      <span class="onbeat-widget-course__price"></span>
      <button class="onbeat-widget-course__readmore">Read more</button>
    </div>
  </section>
</template>
`;


const INLINE_STYLES = `
.onbeat-widget {
  font-family: system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
  padding-bottom: 6px;
  margin-top: 20px;
}

/* Course Card */
.onbeat-widget-course {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 3px 3px rgba(0,0,0,0.1);
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  max-width: 80%;
  width: 100%;
  gap: 0.75rem;
  border: 1px solid lightgrey;
  box-sizing: border-box;
  overflow-wrap: break-word;
}

/* Content area (title + start + description stacked) */
.onbeat-widget-course__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  box-sizing: border-box;
  padding-bottom: 0px;
}

/* Title */
.onbeat-widget-course__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
  word-break: break-word;
}

/* Start date */
.onbeat-widget-course__start {
  font-size: 0.95rem;
  color: #444;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.onbeat-widget-course__opening {
  font-size: 0.9rem;
  color: darkred;
  font-style: italic;
  margin-top: 0.0;'
  margin-bottom: 0;
}

.onbeat-widget-course__closing {
  font-size: 0.9rem;
  color: darkred;
  font-style: italic;
  margin-top: 0.0;
  margin-bottom: 0.0;
}

/* Description */
.onbeat-widget-course__description {
  font-size: 0.95rem;
  white-space: pre-line;
  color: #333;
  word-break: break-word;
  margin-top: 0.8rem;
  margin-bottom: 0.2rem;

  display: -webkit-box;
  -webkit-line-clamp: 3;       /* ← number of visible lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Footer row (price + button on same line) */
.onbeat-widget-course__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Price */
.onbeat-widget-course__price {
  font-size: 1rem;
  font-weight: 600;
  color: #3f5b5b;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

/* Read more button */
.onbeat-widget-course__readmore {
  background: #3f5b5b;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}

.onbeat-widget-course__readmore:hover {
  background: #2c4040;
}

/* ------------------------------
   Responsive adjustments
--------------------------------*/
@media (max-width: 480px) {
  .onbeat-widget-course {
    max-width: 100%;
    width: 100%;
  }

  .onbeat-widget-course__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .onbeat-widget-course__readmore {
    width: 100%;
    text-align: center;
  }
}
`;



  const STYLE_ELEMENT_ID = 'onbeat-course-widget-styles';

  /**
   * Default configuration for the widget. Settings can be overridden via the `TMDWidget` factory function.
   */
  const DEFAULT_OPTIONS = {
    course_id: null,
    course_type: 'all',
    public_token: null,
    description: true,
    show_closed: true,
    card_width: '100%',
    card_align: 'left'
  };

  let cachedCourseTemplate = null;

  function parseCourseCardTemplate(html) {
    const outerTemplate = document.createElement('template');
    outerTemplate.innerHTML = html;
    const templateEl = outerTemplate.content.querySelector('#course-card-template');
    if (!(templateEl instanceof HTMLTemplateElement)) {
      throw new Error('course-card-template not found in template HTML.');
    }
    return templateEl;
  }

  function getCourseCardTemplate() {
    if (!cachedCourseTemplate) {
      cachedCourseTemplate = parseCourseCardTemplate(INLINE_TEMPLATE_HTML);
    }
    return cachedCourseTemplate;
  }

  function ensureInlineStyles() {
    if (document.getElementById(STYLE_ELEMENT_ID)) {
      return;
    }
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ELEMENT_ID;
    styleEl.textContent = INLINE_STYLES;
    document.head.appendChild(styleEl);
  }

  /**
   * Resolve a DOM node from a selector string or return the node if one is provided.
   *
   * @param {string | HTMLElement} target
   * @returns {HTMLElement | null}
   */
  function resolveContainer(target) {
    if (!target) {
      return null;
    }
    if (typeof target === 'string') {
      return document.querySelector(target);
    }
    if (target instanceof HTMLElement) {
      return target;
    }
    return null;
  }


  function buildRequestUrl(settings) {
    const base = DEFAULT_BASE_URL;

    let url;
    try {
      url = new URL(base, base.startsWith('http') ? undefined : global.location?.origin);
    } catch (error) {
      return base;
    }

    url.href += '/' + settings.public_token;

    const hasCourseId = settings.course_id != null;
    const hasCourseTypes = Array.isArray(settings.course_type) && settings.course_type.length > 0;

    // Rule: course_id take precedence if both exist; when both are missing request all data
    if (hasCourseId) {
        url.searchParams.set('course_id', settings.course_id);
    } else if (hasCourseTypes) {
        url.searchParams.set('course_type', settings.course_type.join(','));
    }
    return url.toString();
  }


  function renderCourseCard(container, course, template, settings) {
    const fragment = template.content.cloneNode(true);
    const wrapper = fragment.firstElementChild;

    // Apply custom width
    if (settings.card_width) {
      wrapper.style.maxWidth = settings.card_width;
    }

    // Apply alignment
    switch (settings.card_align) {
      case 'center':
        wrapper.style.alignSelf = 'center';
        break;
      case 'right':
        wrapper.style.alignSelf = 'flex-end';
        break;
      default: // left
        wrapper.style.alignSelf = 'flex-start';
    }

    if (!wrapper) {
      return null;
    }

    const title = wrapper.querySelector('.onbeat-widget-course__title');
    if (title) {
      title.textContent = course.name ?? 'Course';
    }

    const start = wrapper.querySelector('.onbeat-widget-course__start');
    const openingEl = wrapper.querySelector('.onbeat-widget-course__opening');
    const closingEl = wrapper.querySelector('.onbeat-widget-course__closing');
    if (course.start) {
        const dateStr = new Date(course.start).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Parse the time and format to HH:MM
        let timeStr = '';
        if (course.starttime) {
            const timeObj = new Date(`1970-01-01T${course.starttime}`);
            timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } else {
            const timeStr = '';
        }

        start.textContent = `Start: ${dateStr}, ${timeStr}`;
        }

    if (openingEl) {
        const openingDate = new Date(course.opening);
        const now = new Date();

        if (openingDate > now) {
            const formattedOpening = openingDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
            });
            openingEl.textContent = `Registration opens ${formattedOpening}`;
        } else {
            openingEl.remove();
        }
        }

    if (closingEl) {
        const closingDate = new Date(course.closing);
        const now = new Date();

        if (closingDate < now) {
            closingEl.textContent = `Registration is already closed`;
        } else {
            closingEl.remove();
        }
        }

    const description = wrapper.querySelector('.onbeat-widget-course__description');
    if (settings.description) {
      if (description) {
        description.textContent = course.description ?? '';
      }
    } else {
      description.remove();
    }

    const price = wrapper.querySelector('.onbeat-widget-course__price');
    if (price) {
      price.textContent = course.price ? `Price: ${course.price}`: '';
    }

    const readMoreBtn = wrapper.querySelector('.onbeat-widget-course__readmore');
    if (readMoreBtn) {
      if (course.link) {
        readMoreBtn.addEventListener('click', () => {
          global.open(course.link, '_blank', 'noopener');
        });
      } else {
        readMoreBtn.disabled = true;
      }
    }

    container.appendChild(wrapper);
    return wrapper;
  }

  function showMessage(container, message) {
    if (Array.isArray(container._courses)) {
      container._courses.forEach((instance) => {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      });
    }
    container._courses = [];
    container.innerHTML = '';

    const paragraph = document.createElement('p');
    paragraph.className = 'onbeat-widget-message';
    paragraph.textContent = message;
    container.appendChild(paragraph);
  }

  async function OnbeatCourseWidget(options) {
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const container = resolveContainer(settings.container);
    if (!container) {
      throw new Error('OnbeatCourseWidget requires a valid container element.');
    }

    ensureInlineStyles();
    container.classList.add('onbeat-widget');

    showMessage(container, 'Loading courses...');

    const requestUrl = buildRequestUrl(settings);

    let response;
    try {
      response = await fetch(requestUrl, { credentials: 'omit' });
    } catch (error) {
      showMessage(container, 'Unable to show courses');
      throw error;
    }

    if (!response.ok) {
      showMessage(container, 'Failed to load courses.');
      throw new Error(`OnbeatCourseWidget request failed with status ${response.status}`);
    }

    const payload = await response.json();
    let courses = payload.result;

    if (!settings.show_closed) {
      const now = new Date();
      courses = courses.filter((course) => {
        const opening = course.opening ? new Date(course.opening) : null;
        const closing = course.closing ? new Date(course.closing) : null;

        // Only include if registration is currently open
        const isOpen =
          (!opening || opening <= now) && (!closing || closing >= now);

        return isOpen;
      });
    }

    if (Array.isArray(container._courses)) {
      container._courses.forEach((instance) => {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      });
    }
    container.innerHTML = '';

    let courseCardTemplate;
    try {
      courseCardTemplate = getCourseCardTemplate();
    } catch (error) {
      showMessage(container, 'Failed to load course template.');
      throw error;
    }

    container._courses = courses.map((course) =>
      renderCourseCard(container, course, courseCardTemplate, settings)
    );
  }

  global.OnbeatCourseWidget = OnbeatCourseWidget;
})(window);
