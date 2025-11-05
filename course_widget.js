(function (global) {
  /**
   * Base endpoint for course queries
   */

  // const DEFAULT_BASE_URL = 'https://onbeat.dance/api/get_courses';
  const DEFAULT_BASE_URL = 'http://localhost:5000/api/get_courses';

  const INLINE_TEMPLATE_HTML = `
<template id="course-card-template">
  <section class="onbeat-widget-course">
    <h2 class="onbeat-widget-course__title"></h2>
    <p class="onbeat-widget-course__start"></p>
    <div class="onbeat-widget-course__buttons">
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
}

.onbeat-widget-course {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 500px;
  width: 100%;
}

.onbeat-widget-course__title {
  font-size: 1.25rem;
  font-weight: 600;
}

.onbeat-widget-course__buttons {
  display: flex;
  gap: 0.5rem;
}

.onbeat-widget-course__readmore {
  background: white;
  border: 1px solid #ccc;
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.onbeat-widget-course__register {
  background: #3f5b5b;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0.5rem 1rem;
  cursor: pointer;
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

    const hasCourseId = Array.isArray(settings.course_id) && settings.course_id.length == 1;
    const hasCourseTypes = Array.isArray(settings.course_type) && settings.course_type.length > 0;

    // Rule: course_type take precedence if both exist; when both are missing request all data
    if (hasCourseTypes) {
      url.searchParams.set('course_type', settings.course_type.join(','));
    } else if (hasCourseId) {
      url.searchParams.set('course_id', settings.course_id.join(','));
    }

    return url.toString();
  }


  function renderCourseCard(container, course, template) {
    const fragment = template.content.cloneNode(true);
    const wrapper = fragment.firstElementChild;
    console.log(wrapper);
    if (!wrapper) {
      return null;
    }

    const title = wrapper.querySelector('.onbeat-widget-course__title');
    if (title) {
      title.textContent = course.name ?? 'Course';
    }

    const start = wrapper.querySelector('.onbeat-widget-course__start');
    if (start) {
      start.textContent = course.start
        ? `Starts ${new Date(course.start).toLocaleDateString()}`
        : '';
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

    const registerBtn = wrapper.querySelector('.onbeat-widget-course__register');
    if (registerBtn) {
      if (course.registration_url) {
        registerBtn.addEventListener('click', () => {
          global.open(course.registration_url, '_blank', 'noopener');
        });
      } else {
        registerBtn.disabled = true;
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
    const courses = payload.result;
    console.log(payload);
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
      renderCourseCard(container, course, courseCardTemplate)
    );
  }

  global.OnbeatCourseWidget = OnbeatCourseWidget;
})(window);
