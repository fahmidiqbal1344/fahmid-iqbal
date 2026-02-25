async function loadSiteData() {
  const res = await fetch("data/site.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data/site.json");
  return await res.json();
}

function setActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  const map = {
    "index.html": "home",
    "education.html": "education",
    "publications.html": "publications",
    "employment.html": "employment",
  };
  const key = map[path] || "home";
  document.querySelectorAll("nav a").forEach(a => {
    a.removeAttribute("aria-current");
    if (a.dataset.nav === key) a.setAttribute("aria-current", "true");
  });
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  });
  for (const c of children) node.append(c);
  return node;
}

function renderHeader(data) {
  const nameEl = document.getElementById("personName");
  const tagEl  = document.getElementById("personTagline");
  if (nameEl) nameEl.textContent = data.person.name;
  if (tagEl) tagEl.textContent = data.person.tagline;

  const nameEl2 = document.getElementById("personName2");
  const tagEl2  = document.getElementById("personTagline2");
  if (nameEl2) nameEl2.textContent = data.person.name;
  if (tagEl2) tagEl2.textContent = data.person.tagline;
  const intro = document.getElementById("introText");
  if (intro) intro.textContent = data.person.intro || "";

  const avatar = document.getElementById("avatarImg");
  if (avatar) {
    avatar.src = data.person.avatar || "assets/img/avatar.jpg";
    avatar.alt = `${data.person.name} photo`;
  }

  const contact = document.getElementById("contactBlock");
  if (contact) {
    contact.innerHTML = "";
    const items = [
      ["✉️", data.person.email ? `mailto:${data.person.email}` : "", data.person.email || ""],
      ["📞", "", data.person.phone || ""],
      ["🎓", data.person.scholar || "", "Google Scholar"],
      ["💻", data.person.github || "", "GitHub"]
    ];

    items.forEach(([icon, href, label]) => {
      if (!label) return;
      const row = el("div", {}, []);
      row.append(document.createTextNode(icon + " "));
      if (href) {
        row.append(el("a", { href, target: href.startsWith("http") ? "_blank" : null, rel: "noreferrer" }, [label]));
      } else {
        row.append(document.createTextNode(label));
      }
      contact.append(row);
    });

    const pills = document.getElementById("pillRow");
    if (pills) {
      // Customize these tags anytime:
      const tags = ["NLP", "Machine Learning", "Deep Learning", "Data Science"];
      pills.innerHTML = "";
      tags.forEach(t => pills.append(el("span", { class: "pill" }, [t])));
    }
  }

  const footerName = document.getElementById("personNameFooter");
  if (footerName) footerName.textContent = data.person.name || "";
}

function renderNews(data) {
  const root = document.getElementById("newsList");
  if (!root) return;

  const items = Array.isArray(data.news) ? data.news : [];
  root.innerHTML = "";

  if (items.length === 0) {
    root.textContent = "No updates yet.";
    return;
  }

  const sorted = [...items].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  sorted.forEach(n => {
    const title = n.title || "Update";
    const date = n.date || "";
    const text = n.text || "";
    const img = (n.image || "").trim();
    const alt = n.image_alt || title;

    const mainChildren = [
      el("h4", { class: "news-title" }, [title]),
      el("p", { class: "news-text" }, [text])
    ];

    if (img) {
      mainChildren.push(
        el("div", { class: "news-figure" }, [
          el("img", { class: "news-img", src: img, alt, loading: "lazy" }, [])
        ])
      );
    }

    if (n.link && String(n.link).trim()) {
      mainChildren.push(
        el("div", { class: "news-actions" }, [
          el("a", { class: "taglink", href: n.link, target: "_blank", rel: "noreferrer" }, ["↗ Details"])
        ])
      );
    }

    root.append(
      el("div", { class: "news-card" }, [
        el("div", { class: "news-date" }, [date]),
        el("div", { class: "news-main" }, mainChildren)
      ])
    );
  });
}

function renderEducation(data) {
  const root = document.getElementById("educationList");
  if (!root) return;
  root.innerHTML = "";

  (data.education || []).forEach(ed => {
    const ul = (ed.details && ed.details.length)
      ? el("ul", {}, ed.details.map(x => el("li", {}, [x])))
      : document.createTextNode("");

    root.append(
      el("div", { class: "edu-item" }, [
        el("div", { class: "edu-grid" }, [
          el("div", { class: "edu-when" }, [ed.range || ""]),
          el("div", { class: "edu-what" }, [
            el("b", {}, [ed.degree || ""]),
            el("div", { class: "meta" }, [ed.place || ""]),
            ul
          ])
        ])
      ])
    );
  });
}

function renderEmployment(data) {
  const root = document.getElementById("employmentList");
  if (!root) return;
  root.innerHTML = "";

  (data.employment || []).forEach(job => {
    const bullets = (job.bullets || []).length
      ? el("ul", {}, job.bullets.map(x => el("li", {}, [x])))
      : document.createTextNode("");

    root.append(
      el("div", { class: "item" }, [
        el("div", { class: "when" }, [job.range || ""]),
        el("div", { class: "what" }, [
          el("b", {}, [job.title || ""]),
          el("div", { class: "meta" }, [job.place || ""]),
          bullets
        ])
      ])
    );
  });
}

function renderPublications(data) {
  const root = document.getElementById("pubList");
  if (!root) return;
  root.innerHTML = "";

  const pubs = [...(data.publications || [])]
    .sort((a,b) => (parseInt(b.year)||0) - (parseInt(a.year)||0));

  pubs.forEach(p => {
    const doiUrl = p.doi ? `https://doi.org/${p.doi}` : "";
    const links = el("div", { class: "links" }, []);

    if (p.links?.pdf) links.append(el("a", { class: "taglink", href: p.links.pdf, target: "_blank", rel: "noreferrer" }, ["📄 PDF"]));
    if (doiUrl) links.append(el("a", { class: "taglink", href: doiUrl, target: "_blank", rel: "noreferrer" }, ["🔗 DOI"]));
    if (p.links?.code) links.append(el("a", { class: "taglink", href: p.links.code, target: "_blank", rel: "noreferrer" }, ["💻 Code"]));

    root.append(
      el("div", { class: "pub" }, [
        el("p", { class: "title" }, [p.title || ""]),
        el("p", { class: "venue" }, [`${p.venue || ""} · ${p.year || ""}`]),
        links
      ])
    );
  });

  const scholarLink = document.getElementById("scholarLink");
  if (scholarLink) scholarLink.href = data.person?.scholar || "#";
}

async function boot() {
  setActiveNav();
  const data = await loadSiteData();

  renderHeader(data);

  // ✅ FIX: news was not being rendered before
  renderNews(data);

  renderEducation(data);
  renderEmployment(data);
  renderPublications(data);

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

boot().catch(err => {
  console.error(err);
  const errBox = document.getElementById("errorBox");
  if (errBox) errBox.style.display = "block";
});