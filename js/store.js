/* ===========================================================================
   STORE — lapisan data
   ---------------------------------------------------------------------------
   API tunggal yang dipakai aplikasi. Dua implementasi di belakang layar:
     • Firebase  → Auth (Google) + Firestore, sinkron antar perangkat.
     • Lokal     → localStorage, dipakai otomatis saat Firebase belum di-set,
                    sehingga aplikasi tetap bisa dicoba.

   Bentuk dokumen project:
   { id, title, premise, synopsis, coverImage, targetWords, currentWords,
     deadline, status, genre,
     characters:[{id,name,role,description,motivation,conflict,arc}],
     beats:{ <beatKey>: "isi..." },
     plotPoints:[{id,text}],
     notes:[{id,tag,title,body,createdAt}],
     createdAt, updatedAt }
   =========================================================================== */
window.JC = window.JC || {};

JC.store = (function () {
  const MODE = JC.useFirebase ? "firebase" : "local";
  let _user = null;
  const authCbs = [];

  function onAuth(cb) { authCbs.push(cb); if (_user !== undefined) cb(_user); }
  function emitAuth() { authCbs.forEach(cb => cb(_user)); }

  function blankProject(title) {
    const now = new Date().toISOString();
    return {
      title: title || "Novel Tanpa Judul",
      premise: "", synopsis: "", coverImage: null,
      targetWords: 80000, currentWords: 0, deadline: "", status: "draft", genre: "",
      characters: [], beats: {}, plotPoints: [], notes: [],
      createdAt: now, updatedAt: now,
    };
  }

  /* =======================================================================
     LOCAL implementation
     ======================================================================= */
  const Local = (function () {
    const LKEY = u => `jc:data:${u}`;
    const UKEY = "jc:user";
    let listeners = [];
    function read(u) { try { return JSON.parse(localStorage.getItem(LKEY(u)) || "{}"); } catch { return {}; } }
    function write(u, obj) { localStorage.setItem(LKEY(u), JSON.stringify(obj)); listeners.forEach(fn => fn()); }

    return {
      init() {
        try { const saved = JSON.parse(localStorage.getItem(UKEY) || "null"); _user = saved; }
        catch { _user = null; }
        emitAuth();
      },
      signIn() {
        _user = { uid: "lokal", name: "Penulis", email: "lokal@jalancerita.app", photoURL: null };
        localStorage.setItem(UKEY, JSON.stringify(_user));
        emitAuth();
        return Promise.resolve();
      },
      signOut() { _user = null; localStorage.removeItem(UKEY); emitAuth(); return Promise.resolve(); },
      observeProjects(cb) {
        const fn = () => {
          const obj = read(_user.uid);
          const arr = Object.values(obj).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
          cb(arr);
        };
        listeners.push(fn); fn();
        return () => { listeners = listeners.filter(l => l !== fn); };
      },
      observeProject(id, cb) {
        const fn = () => { const obj = read(_user.uid); cb(obj[id] || null); };
        listeners.push(fn); fn();
        return () => { listeners = listeners.filter(l => l !== fn); };
      },
      create(data) {
        const obj = read(_user.uid);
        const id = JC.ui.uid();
        obj[id] = Object.assign({ id }, blankProject(), data || {});
        write(_user.uid, obj);
        return Promise.resolve(id);
      },
      update(id, patch) {
        const obj = read(_user.uid);
        if (!obj[id]) return Promise.resolve();
        obj[id] = Object.assign({}, obj[id], patch, { updatedAt: new Date().toISOString() });
        write(_user.uid, obj);
        return Promise.resolve();
      },
      remove(id) {
        const obj = read(_user.uid); delete obj[id]; write(_user.uid, obj);
        return Promise.resolve();
      },
    };
  })();

  /* =======================================================================
     FIREBASE implementation (compat SDK — global `firebase`)
     ======================================================================= */
  const Fire = (function () {
    let db, auth, provider;
    function col() { return db.collection("users").doc(_user.uid).collection("projects"); }
    return {
      init() {
        firebase.initializeApp(JC.config);
        auth = firebase.auth();
        db = firebase.firestore();
        provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        auth.onAuthStateChanged(u => {
          _user = u ? { uid: u.uid, name: u.displayName || "Penulis", email: u.email, photoURL: u.photoURL } : null;
          emitAuth();
        });
      },
      signIn() { return auth.signInWithPopup(provider).catch(e => { JC.ui.toast("Gagal masuk: " + (e.message || e.code), "err"); throw e; }); },
      signOut() { return auth.signOut(); },
      observeProjects(cb) {
        return col().orderBy("updatedAt", "desc").onSnapshot(
          snap => { const arr = []; snap.forEach(d => arr.push(Object.assign({ id: d.id }, d.data()))); cb(arr); },
          err => { console.error(err); JC.ui.toast("Gagal memuat data", "err"); }
        );
      },
      observeProject(id, cb) {
        return col().doc(id).onSnapshot(
          d => cb(d.exists ? Object.assign({ id: d.id }, d.data()) : null),
          err => { console.error(err); JC.ui.toast("Gagal memuat novel", "err"); }
        );
      },
      create(data) {
        const doc = Object.assign(blankProject(), data || {});
        return col().add(doc).then(ref => ref.id);
      },
      update(id, patch) {
        return col().doc(id).set(Object.assign({}, patch, { updatedAt: new Date().toISOString() }), { merge: true });
      },
      remove(id) { return col().doc(id).delete(); },
    };
  })();

  const impl = MODE === "firebase" ? Fire : Local;

  return {
    mode: MODE,
    init: () => impl.init(),
    onAuth,
    user: () => _user,
    signIn: () => impl.signIn(),
    signOut: () => impl.signOut(),
    observeProjects: (cb) => impl.observeProjects(cb),
    observeProject: (id, cb) => impl.observeProject(id, cb),
    create: (data) => impl.create(data),
    update: (id, patch) => impl.update(id, patch),
    remove: (id) => impl.remove(id),
    blankProject,
  };
})();
