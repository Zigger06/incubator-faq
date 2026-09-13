(() => {
  "use strict";

  const items = Array.isArray(window.FAQ_ITEMS) ? window.FAQ_ITEMS : [];
  const categories = Array.isArray(window.FAQ_CATEGORIES) ? window.FAQ_CATEGORIES : [];
  const store = window.STORE_INFO || {};

  const state = {
    category: "all",
    query: "",
    allOpen: false,
  };

  const elements = {
    searchForm: document.querySelector("#search-form"),
    searchInput: document.querySelector("#faq-search"),
    clearSearch: document.querySelector("#clear-search"),
    categoryList: document.querySelector("#category-list"),
    faqList: document.querySelector("#faq-list"),
    emptyState: document.querySelector("#empty-state"),
    resetFilters: document.querySelector("#reset-filters"),
    activeSearch: document.querySelector("#active-search"),
    activeCategoryLabel: document.querySelector("#active-category-label"),
    totalCount: document.querySelector("#total-count"),
    toggleAll: document.querySelector("#toggle-all"),
    currentYear: document.querySelector("#current-year"),
  };

  const normalize = (value) =>
    String(value || "")
      .toLocaleLowerCase("tg")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[ё]/g, "е")
      .trim();

  const getCategory = (id) => categories.find((category) => category.id === id);

  const matchesQuery = (item, query) => {
    if (!query) return true;
    const words = normalize(query).split(/\s+/).filter(Boolean);
    const haystack = normalize(
      [item.question, ...(item.answer || []), ...(item.keywords || [])].join(" ")
    );
    return words.every((word) => haystack.includes(word));
  };

  const filteredItems = () =>
    items.filter((item) => {
      const inCategory = state.category === "all" || item.category === state.category;
      return inCategory && matchesQuery(item, state.query);
    });

  const updateUrl = () => {
    const url = new URL(window.location.href);
    if (state.query) url.searchParams.set("q", state.query);
    else url.searchParams.delete("q");
    if (state.category !== "all") url.searchParams.set("category", state.category);
    else url.searchParams.delete("category");
    window.history.replaceState({}, "", url);
  };

  const createCategoryButton = ({ id, label }, count) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-button";
    button.dataset.category = id;
    button.setAttribute("aria-pressed", String(state.category === id));

    const name = document.createElement("span");
    name.textContent = label;
    const badge = document.createElement("span");
    badge.className = "category-count";
    badge.textContent = count;

    button.append(name, badge);
    button.addEventListener("click", () => {
      state.category = id;
      state.allOpen = false;
      updateUrl();
      render();
      if (window.matchMedia("(max-width: 820px)").matches) {
        document.querySelector(".faq-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    return button;
  };

  const renderCategories = () => {
    elements.categoryList.replaceChildren();
    elements.categoryList.append(createCategoryButton({ id: "all", label: "Ҳамаи саволҳо" }, items.length));
    categories.forEach((category) => {
      const count = items.filter((item) => item.category === category.id).length;
      elements.categoryList.append(createCategoryButton(category, count));
    });
  };

  const createFaqItem = (item, index) => {
    const details = document.createElement("details");
    details.className = "faq-item";
    details.id = item.id;
    details.open = state.allOpen || (window.location.hash === `#${item.id}` && !state.query);

    const summary = document.createElement("summary");
    const number = document.createElement("span");
    number.className = "faq-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const question = document.createElement("span");
    question.className = "faq-question";
    question.textContent = item.question;
    const toggle = document.createElement("span");
    toggle.className = "faq-toggle";
    toggle.setAttribute("aria-hidden", "true");

    summary.append(number, question, toggle);

    const answer = document.createElement("div");
    answer.className = "faq-answer";
    (item.answer || []).forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      answer.append(p);
    });

    const category = getCategory(item.category);
    if (category) {
      const meta = document.createElement("span");
      meta.className = "answer-category";
      meta.textContent = category.label;
      answer.append(meta);
    }

    details.append(summary, answer);
    details.addEventListener("toggle", () => {
      if (details.open && !state.query) {
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}#${item.id}`);
      }
    });
    return details;
  };

  const renderFaqs = () => {
    const visible = filteredItems();
    elements.faqList.replaceChildren();
    visible.forEach((item, index) => elements.faqList.append(createFaqItem(item, index)));

    const hasResults = visible.length > 0;
    elements.faqList.hidden = !hasResults;
    elements.emptyState.hidden = hasResults;
    elements.toggleAll.hidden = !hasResults;
    elements.toggleAll.textContent = state.allOpen ? "Ҳамаро бастан" : "Ҳамаро кушодан";

    if (state.query) {
      elements.activeSearch.hidden = false;
      elements.activeSearch.textContent = `${visible.length} ҷавоб барои «${state.query}»`;
    } else {
      elements.activeSearch.hidden = true;
      elements.activeSearch.textContent = "";
    }
  };

  const updateLabels = () => {
    const current = state.category === "all" ? null : getCategory(state.category);
    elements.activeCategoryLabel.textContent = current ? current.label : "Ҳамаи саволҳо";
    elements.totalCount.textContent = items.length;
    elements.clearSearch.hidden = !state.query;
  };

  const render = () => {
    renderCategories();
    renderFaqs();
    updateLabels();
  };

  const reset = () => {
    state.category = "all";
    state.query = "";
    state.allOpen = false;
    elements.searchInput.value = "";
    updateUrl();
    render();
    elements.searchInput.focus();
  };

  const applyStoreInfo = () => {
    const message = encodeURIComponent(store.whatsappMessage || "Салом!");
    const whatsappUrl = `https://wa.me/${store.phoneInternational}?text=${message}`;
    document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
      link.href = whatsappUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
    document.querySelectorAll("[data-phone-link]").forEach((link) => {
      link.href = `tel:+${store.phoneInternational}`;
      link.textContent = `+992 ${store.phoneDisplay}`;
    });
    document.querySelectorAll("[data-address]").forEach((node) => {
      node.textContent = store.address || "";
    });
  };

  const addStructuredData = () => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: (item.answer || []).join(" "),
        },
      })),
    });
    document.head.append(script);
  };

  const initializeFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const query = params.get("q") || "";
    state.category = category === "all" || categories.some((item) => item.id === category) ? category : "all";
    state.query = query.trim();
    elements.searchInput.value = state.query;
  };

  elements.searchForm.addEventListener("submit", (event) => event.preventDefault());
  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    state.allOpen = false;
    updateUrl();
    render();
  });
  elements.clearSearch.addEventListener("click", () => {
    state.query = "";
    elements.searchInput.value = "";
    updateUrl();
    render();
    elements.searchInput.focus();
  });
  elements.resetFilters.addEventListener("click", reset);
  elements.toggleAll.addEventListener("click", () => {
    state.allOpen = !state.allOpen;
    renderFaqs();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      elements.searchInput.focus();
    }
    if (event.key === "Escape" && document.activeElement === elements.searchInput) {
      elements.searchInput.blur();
    }
  });

  initializeFromUrl();
  applyStoreInfo();
  addStructuredData();
  elements.currentYear.textContent = new Date().getFullYear();
  render();
})();
