/* RVKino Distribution — логика сайта и локальной админ-панели */
(() => {
  "use strict";

  const STORAGE_KEYS = { films: "rvkino_distribution_films_v1", contacts: "rvkino_distribution_contacts_v1" };
  // Пароль в клиентском JS не является защитой: это только скрытие интерфейса от случайного посетителя.
  const ADMIN_PASSWORD = "27012009";

  const defaultFilms = [
    {id:"film-1",title:"По следам счастья",year:"2026",genre:"Драма, короткометражка",synopsis:"Брат и сестра борются за одну должность. Амбиции разрушают семью.",director:"Татьяна Кузьмина",producer:"Владислав Роженцев",cast:"Матвей Вольный, Виолетта Байракова, Мария Коцич и др.",runtime:"",poster:"assets/posters/po_sledam_schastya.jpg",filmUrl:"https://rvkino.ru/films/51/movie-26/",trailerUrl:"",showTrailer:true},
    {id:"film-2",title:"Кража без правил",year:"2026",genre:"Драма",synopsis:"Герой совершает кражу и бежит, но постепенно понимает, что судит его собственная совесть.",director:"Владислав Роженцев",runtime:"9 мин.",poster:"assets/posters/krazha_bez_pravil.jpg",filmUrl:"https://rvkino.ru/films/47/movie-22/",trailerUrl:"",showTrailer:true},
    {id:"film-3",title:"Грань выбора",year:"2026",genre:"Триллер, драма",synopsis:"История о решении, после которого привычная жизнь уже не будет прежней.",director:"Диана Тумреева",poster:"assets/posters/gran_vybora.jpg",filmUrl:"https://rvkino.ru/films/17/11/",trailerUrl:"",showTrailer:false},
    {id:"film-4",title:"Таисья Калинина",year:"2025",genre:"Документальный",synopsis:"Документальный проект о Таисье Калининой.",director:"Владислав Роженцев",runtime:"",poster:"assets/posters/taissya_kalinina.jpg",filmUrl:"",trailerUrl:"",showTrailer:true,budget:"25 000 ₽"},
    {id:"film-5",title:"Не мой голос",year:"2024",genre:"Комедия",synopsis:"Поменялись голосами — и вместе с этим привычный мир героев перевернулся.",director:"Владислав Роженцев",poster:"assets/posters/ne_moy_golos.jpg",filmUrl:"https://rvkino.ru/series/1/NoMyvoice/",trailerUrl:"",showTrailer:false},
    {id:"film-6",title:"Вещества в эфире",year:"",genre:"Музыкальная драма",synopsis:"История группы «Вещества». Проект стал финалистом фестивалей «Врата Сибири» и «Золото котловки».",director:"",poster:"assets/posters/veshhestva_v_efire.jpg",filmUrl:"",trailerUrl:"",showTrailer:false}
  ];

  const defaultContacts = {email:"",phone:"",dianaVk:"",dianaTelegram:""};
  const safeRead = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return structuredClone(fallback);
      const parsed = JSON.parse(raw);
      return parsed ?? structuredClone(fallback);
    } catch (error) {
      console.warn("Не удалось прочитать LocalStorage:", error);
      return structuredClone(fallback);
    }
  };
  let films = safeRead(STORAGE_KEYS.films, defaultFilms);
  let contacts = safeRead(STORAGE_KEYS.contacts, defaultContacts);
  if (!Array.isArray(films)) films = structuredClone(defaultFilms);
  if (!contacts || typeof contacts !== "object") contacts = structuredClone(defaultContacts);

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const filmGrid = $("#filmGrid");
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  const safeUrl = value => {
    try { const url = new URL(value, window.location.href); return ["http:","https:"].includes(url.protocol) ? url.href : ""; }
    catch { return ""; }
  };

  function renderFilms() {
    if (!films.length) {
      filmGrid.innerHTML = '<p class="film-empty">Проекты скоро появятся.</p>';
      return;
    }
    filmGrid.innerHTML = films.map((film, index) => {
      const poster = escapeHTML(film.poster || "");
      const title = escapeHTML(film.title || "Без названия");
      const filmUrl = safeUrl(film.filmUrl);
      const trailerUrl = safeUrl(film.trailerUrl);
      const showTrailer = Boolean(film.showTrailer && trailerUrl);
      const synopsis = escapeHTML(film.synopsis || "");
      const year = escapeHTML(film.year || "");
      const genre = escapeHTML(film.genre || "");
      const director = escapeHTML(film.director || "");
      const runtime = escapeHTML(film.runtime || "");
      const details = [year, runtime].filter(Boolean).join(" · ");
      return `
        <article class="film-card reveal" style="transition-delay:${Math.min(index % 3, 2) * 70}ms">
          <div class="poster-wrap">
            <img src="${poster}" alt="Постер фильма «${title}»" loading="lazy" onerror="this.remove()">
            <span class="poster-placeholder">${title}</span>
          </div>
          <div class="film-meta"><span>${details}</span><span>${escapeHTML(film.rating || "")}</span></div>
          <h3>${title}</h3>
          ${genre ? `<p class="film-genre">${genre}</p>` : ""}
          ${synopsis ? `<p class="film-synopsis clamped">${synopsis}</p><button class="read-more" type="button">Читать далее</button>` : ""}
          ${director ? `<p class="film-director">Режиссёр: ${director}</p>` : ""}
          <div class="film-actions">
            ${filmUrl ? `<a class="button button-dark" href="${escapeHTML(filmUrl)}" target="_blank" rel="noopener">Смотреть <span>↗</span></a>` : ""}
            ${showTrailer ? `<button class="button button-outline trailer-trigger" type="button" data-trailer="${escapeHTML(trailerUrl)}">Трейлер <span>▶</span></button>` : ""}
          </div>
        </article>`;
    }).join("");
    bindFilmInteractions();
    observeReveals();
  }

  function bindFilmInteractions() {
    filmGrid.querySelectorAll(".read-more").forEach(button => button.addEventListener("click", () => {
      const text = button.previousElementSibling;
      const expanded = text.classList.toggle("clamped") === false;
      button.textContent = expanded ? "Свернуть" : "Читать далее";
    }));
    filmGrid.querySelectorAll(".trailer-trigger").forEach(button => button.addEventListener("click", () => openTrailer(button.dataset.trailer)));
  }

  function renderContacts() {
    const email = contacts.email || "";
    const phone = contacts.phone || "";
    $("#contactEmail").textContent = email || "—";
    $("#contactEmail").href = email ? `mailto:${email}` : "mailto:";
    $("#contactPhone").textContent = phone || "—";
    $("#contactPhone").href = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "tel:";
    document.querySelectorAll('[data-contact-link="dianaVk"]').forEach(a => {
      a.href = safeUrl(contacts.dianaVk) || "#";
      a.hidden = !safeUrl(contacts.dianaVk);
    });
    document.querySelectorAll('[data-contact-link="dianaTelegram"]').forEach(a => {
      a.href = safeUrl(contacts.dianaTelegram) || "#";
      a.hidden = !safeUrl(contacts.dianaTelegram);
    });
  }

  function saveFilms() {
    try { localStorage.setItem(STORAGE_KEYS.films, JSON.stringify(films)); }
    catch (error) { alert("Не удалось сохранить фильмы. Возможно, хранилище браузера заполнено или отключено."); }
    renderFilms();
    renderAdminFilmRows();
  }
  function saveContacts() {
    try { localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contacts)); }
    catch (error) { alert("Не удалось сохранить контакты в этом браузере."); }
    renderContacts();
  }

  // Мобильная навигация.
  const mobileMenu = $("#mobileMenu"), menuToggle = $("#menuToggle");
  function closeMenu() {
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.add("open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  });
  $("#menuClose").addEventListener("click", closeMenu);
  mobileMenu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

  // Универсальные модальные окна.
  function openModal(element) {
    element.classList.add("open");
    element.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function closeModal(element) {
    element.classList.remove("open");
    element.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.open") && !mobileMenu.classList.contains("open")) document.body.classList.remove("no-scroll");
  }
  document.querySelectorAll("[data-close-modal]").forEach(el => el.addEventListener("click", () => {
    const modal = el.closest(".modal");
    if (modal === $("#trailerModal")) $("#trailerFrame").innerHTML = "";
    closeModal(modal);
  }));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal.open").forEach(modal => {
        if (modal === $("#trailerModal")) $("#trailerFrame").innerHTML = "";
        closeModal(modal);
      });
      closeMenu();
    }
  });

  function openTrailer(url) {
    const safe = safeUrl(url);
    if (!safe) return;
    // VK iframe-ссылка обычно имеет вид https://vk.com/video_ext.php?...
    const frame = document.createElement("iframe");
    frame.src = safe;
    frame.title = "Трейлер фильма";
    frame.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    frame.allowFullscreen = true;
    $("#trailerFrame").replaceChildren(frame);
    openModal($("#trailerModal"));
  }

  // Админ-панель. Важно: LocalStorage и пароль в JS не обеспечивают серверную безопасность.
  const adminModal = $("#adminModal");
  $("#adminOpen").addEventListener("click", () => {
    $("#adminLogin").hidden = false;
    $("#adminDashboard").hidden = true;
    $("#adminPassword").value = "";
    $("#loginMessage").textContent = "";
    openModal(adminModal);
  });
  $("#loginForm").addEventListener("submit", event => {
    event.preventDefault();
    if ($("#adminPassword").value === ADMIN_PASSWORD) {
      $("#adminLogin").hidden = true;
      $("#adminDashboard").hidden = false;
      renderAdminFilmRows();
      fillContactsForm();
    } else {
      $("#loginMessage").textContent = "Неверный пароль.";
    }
  });
  $("#adminLogout").addEventListener("click", () => {
    $("#adminDashboard").hidden = true;
    $("#adminLogin").hidden = false;
    $("#adminPassword").value = "";
  });
  document.querySelectorAll(".admin-tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(item => item.classList.toggle("active", item === tab));
    $("#adminFilmsPane").hidden = tab.dataset.tab !== "films";
    $("#adminContactsPane").hidden = tab.dataset.tab !== "contacts";
  }));

  function renderAdminFilmRows() {
    $("#adminFilmRows").innerHTML = films.map(film => `
      <tr><td>${escapeHTML(film.title)}</td><td>${escapeHTML(film.year || "—")}</td>
      <td><div class="table-actions"><button type="button" data-edit="${escapeHTML(film.id)}">Изменить</button><button type="button" class="delete-action" data-delete="${escapeHTML(film.id)}">Удалить</button></div></td></tr>
    `).join("") || '<tr><td colspan="3">Фильмов пока нет.</td></tr>';
    $("#adminFilmRows").querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => startFilmEdit(button.dataset.edit)));
    $("#adminFilmRows").querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => {
      const film = films.find(item => item.id === button.dataset.delete);
      if (film && confirm(`Удалить фильм «${film.title}»?`)) {
        films = films.filter(item => item.id !== button.dataset.delete);
        saveFilms();
      }
    }));
  }

  function resetFilmForm() {
    $("#filmForm").reset();
    $("#editFilmId").value = "";
    $("#filmFormTitle").textContent = "Новый фильм";
    $("#filmForm").hidden = true;
  }
  function startFilmEdit(id) {
    const film = films.find(item => item.id === id);
    if (!film) return;
    $("#filmForm").hidden = false;
    $("#filmFormTitle").textContent = "Редактировать фильм";
    $("#editFilmId").value = film.id;
    $("#filmTitle").value = film.title || "";
    $("#filmYear").value = film.year || "";
    $("#filmGenre").value = film.genre || "";
    $("#filmPoster").value = film.poster || "";
    $("#filmUrl").value = film.filmUrl || "";
    $("#filmTrailer").value = film.trailerUrl || "";
    $("#filmDirector").value = film.director || "";
    $("#filmRuntime").value = film.runtime || "";
    $("#filmSynopsis").value = film.synopsis || "";
    $("#filmShowTrailer").checked = Boolean(film.showTrailer);
    $("#filmForm").scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  $("#addFilm").addEventListener("click", () => {
    resetFilmForm();
    $("#filmForm").hidden = false;
    $("#filmFormTitle").textContent = "Новый фильм";
    $("#filmForm").scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  $("#cancelFilmEdit").addEventListener("click", resetFilmForm);
  $("#filmForm").addEventListener("submit", event => {
    event.preventDefault();
    const id = $("#editFilmId").value || `film-${Date.now()}`;
    const existing = films.find(item => item.id === id) || {};
    const updated = {
      ...existing, id,
      title: $("#filmTitle").value.trim(),
      year: $("#filmYear").value.trim(),
      genre: $("#filmGenre").value.trim(),
      poster: $("#filmPoster").value.trim(),
      filmUrl: $("#filmUrl").value.trim(),
      trailerUrl: $("#filmTrailer").value.trim(),
      director: $("#filmDirector").value.trim(),
      runtime: $("#filmRuntime").value.trim(),
      synopsis: $("#filmSynopsis").value.trim(),
      showTrailer: $("#filmShowTrailer").checked
    };
    if (!updated.title) return;
    const index = films.findIndex(item => item.id === id);
    if (index >= 0) films[index] = updated; else films.push(updated);
    saveFilms();
    resetFilmForm();
  });

  function fillContactsForm() {
    $("#editEmail").value = contacts.email || "";
    $("#editPhone").value = contacts.phone || "";
    $("#editDianaVk").value = contacts.dianaVk || "";
    $("#editDianaTelegram").value = contacts.dianaTelegram || "";
  }
  $("#contactsForm").addEventListener("submit", event => {
    event.preventDefault();
    contacts = {
      email: $("#editEmail").value.trim(),
      phone: $("#editPhone").value.trim(),
      dianaVk: $("#editDianaVk").value.trim(),
      dianaTelegram: $("#editDianaTelegram").value.trim()
    };
    saveContacts();
    $("#contactsMessage").textContent = "Контакты сохранены в этом браузере.";
  });

  // Плавное появление блоков при прокрутке.
  let revealObserver;
  function observeReveals() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
      return;
    }
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:0.08});
    document.querySelectorAll(".reveal:not(.is-visible)").forEach(el => revealObserver.observe(el));
  }

  $("#copyrightYear").textContent = new Date().getFullYear();
  renderFilms();
  renderContacts();
  observeReveals();
})();
