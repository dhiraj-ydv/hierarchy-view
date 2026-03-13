/* eslint-disable */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/sql.js/dist/sql-wasm-browser.js
var require_sql_wasm_browser = __commonJS({
  "node_modules/sql.js/dist/sql-wasm-browser.js"(exports, module2) {
    var initSqlJsPromise = void 0;
    var initSqlJs2 = function(moduleConfig) {
      if (initSqlJsPromise) {
        return initSqlJsPromise;
      }
      initSqlJsPromise = new Promise(function(resolveModule, reject) {
        var Module = typeof moduleConfig !== "undefined" ? moduleConfig : {};
        var originalOnAbortFunction = Module["onAbort"];
        Module["onAbort"] = function(errorThatCausedAbort) {
          reject(new Error(errorThatCausedAbort));
          if (originalOnAbortFunction) {
            originalOnAbortFunction(errorThatCausedAbort);
          }
        };
        Module["postRun"] = Module["postRun"] || [];
        Module["postRun"].push(function() {
          resolveModule(Module);
        });
        module2 = void 0;
        var k;
        k || (k = typeof Module != "undefined" ? Module : {});
        var aa = !!globalThis.window, ba = !!globalThis.WorkerGlobalScope;
        k.onRuntimeInitialized = function() {
          function a(f, l) {
            switch (typeof l) {
              case "boolean":
                $b(f, l ? 1 : 0);
                break;
              case "number":
                ac(f, l);
                break;
              case "string":
                bc(f, l, -1, -1);
                break;
              case "object":
                if (null === l) eb(f);
                else if (null != l.length) {
                  var n = ca(l.length);
                  m.set(l, n);
                  cc(f, n, l.length, -1);
                  da(n);
                } else ra(f, "Wrong API use : tried to return a value of an unknown type (" + l + ").", -1);
                break;
              default:
                eb(f);
            }
          }
          function b(f, l) {
            for (var n = [], p = 0; p < f; p += 1) {
              var u = r(l + 4 * p, "i32"), v = dc(u);
              if (1 === v || 2 === v) u = ec(u);
              else if (3 === v) u = fc(u);
              else if (4 === v) {
                v = u;
                u = gc(v);
                v = hc(v);
                for (var K = new Uint8Array(u), I = 0; I < u; I += 1) K[I] = m[v + I];
                u = K;
              } else u = null;
              n.push(u);
            }
            return n;
          }
          function c(f, l) {
            this.Qa = f;
            this.db = l;
            this.Oa = 1;
            this.yb = [];
          }
          function d(f, l) {
            this.db = l;
            this.ob = ea(f);
            if (null === this.ob) throw Error("Unable to allocate memory for the SQL string");
            this.ub = this.ob;
            this.gb = this.Fb = null;
          }
          function e(f) {
            this.filename = "dbfile_" + (4294967295 * Math.random() >>> 0);
            if (null != f) {
              var l = this.filename, n = "/", p = l;
              n && (n = "string" == typeof n ? n : fa(n), p = l ? ha(n + "/" + l) : n);
              l = ia(true, true);
              p = ja(
                p,
                l
              );
              if (f) {
                if ("string" == typeof f) {
                  n = Array(f.length);
                  for (var u = 0, v = f.length; u < v; ++u) n[u] = f.charCodeAt(u);
                  f = n;
                }
                ka(p, l | 146);
                n = la(p, 577);
                ma(n, f, 0, f.length, 0);
                na(n);
                ka(p, l);
              }
            }
            this.handleError(q(this.filename, g));
            this.db = r(g, "i32");
            hb(this.db);
            this.pb = {};
            this.Sa = {};
          }
          var g = y(4), h = k.cwrap, q = h("sqlite3_open", "number", ["string", "number"]), w = h("sqlite3_close_v2", "number", ["number"]), t = h("sqlite3_exec", "number", ["number", "string", "number", "number", "number"]), x = h("sqlite3_changes", "number", ["number"]), D = h(
            "sqlite3_prepare_v2",
            "number",
            ["number", "string", "number", "number", "number"]
          ), ib = h("sqlite3_sql", "string", ["number"]), jc = h("sqlite3_normalized_sql", "string", ["number"]), jb = h("sqlite3_prepare_v2", "number", ["number", "number", "number", "number", "number"]), kc = h("sqlite3_bind_text", "number", ["number", "number", "number", "number", "number"]), kb = h("sqlite3_bind_blob", "number", ["number", "number", "number", "number", "number"]), lc = h("sqlite3_bind_double", "number", ["number", "number", "number"]), mc = h("sqlite3_bind_int", "number", [
            "number",
            "number",
            "number"
          ]), nc = h("sqlite3_bind_parameter_index", "number", ["number", "string"]), oc = h("sqlite3_step", "number", ["number"]), pc = h("sqlite3_errmsg", "string", ["number"]), qc = h("sqlite3_column_count", "number", ["number"]), rc = h("sqlite3_data_count", "number", ["number"]), sc = h("sqlite3_column_double", "number", ["number", "number"]), lb = h("sqlite3_column_text", "string", ["number", "number"]), tc = h("sqlite3_column_blob", "number", ["number", "number"]), uc = h("sqlite3_column_bytes", "number", ["number", "number"]), vc = h(
            "sqlite3_column_type",
            "number",
            ["number", "number"]
          ), wc = h("sqlite3_column_name", "string", ["number", "number"]), xc = h("sqlite3_reset", "number", ["number"]), yc = h("sqlite3_clear_bindings", "number", ["number"]), zc = h("sqlite3_finalize", "number", ["number"]), mb = h("sqlite3_create_function_v2", "number", "number string number number number number number number number".split(" ")), dc = h("sqlite3_value_type", "number", ["number"]), gc = h("sqlite3_value_bytes", "number", ["number"]), fc = h("sqlite3_value_text", "string", ["number"]), hc = h(
            "sqlite3_value_blob",
            "number",
            ["number"]
          ), ec = h("sqlite3_value_double", "number", ["number"]), ac = h("sqlite3_result_double", "", ["number", "number"]), eb = h("sqlite3_result_null", "", ["number"]), bc = h("sqlite3_result_text", "", ["number", "string", "number", "number"]), cc = h("sqlite3_result_blob", "", ["number", "number", "number", "number"]), $b = h("sqlite3_result_int", "", ["number", "number"]), ra = h("sqlite3_result_error", "", ["number", "string", "number"]), nb = h("sqlite3_aggregate_context", "number", ["number", "number"]), hb = h(
            "RegisterExtensionFunctions",
            "number",
            ["number"]
          ), ob = h("sqlite3_update_hook", "number", ["number", "number", "number"]);
          c.prototype.bind = function(f) {
            if (!this.Qa) throw "Statement closed";
            this.reset();
            return Array.isArray(f) ? this.Wb(f) : null != f && "object" === typeof f ? this.Xb(f) : true;
          };
          c.prototype.step = function() {
            if (!this.Qa) throw "Statement closed";
            this.Oa = 1;
            var f = oc(this.Qa);
            switch (f) {
              case 100:
                return true;
              case 101:
                return false;
              default:
                throw this.db.handleError(f);
            }
          };
          c.prototype.Pb = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            return sc(this.Qa, f);
          };
          c.prototype.hc = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            f = lb(this.Qa, f);
            if ("function" !== typeof BigInt) throw Error("BigInt is not supported");
            return BigInt(f);
          };
          c.prototype.mc = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            return lb(this.Qa, f);
          };
          c.prototype.getBlob = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            var l = uc(this.Qa, f);
            f = tc(this.Qa, f);
            for (var n = new Uint8Array(l), p = 0; p < l; p += 1) n[p] = m[f + p];
            return n;
          };
          c.prototype.get = function(f, l) {
            l = l || {};
            null != f && this.bind(f) && this.step();
            f = [];
            for (var n = rc(this.Qa), p = 0; p < n; p += 1) switch (vc(this.Qa, p)) {
              case 1:
                var u = l.useBigInt ? this.hc(p) : this.Pb(p);
                f.push(u);
                break;
              case 2:
                f.push(this.Pb(p));
                break;
              case 3:
                f.push(this.mc(p));
                break;
              case 4:
                f.push(this.getBlob(p));
                break;
              default:
                f.push(null);
            }
            return f;
          };
          c.prototype.Db = function() {
            for (var f = [], l = qc(this.Qa), n = 0; n < l; n += 1) f.push(wc(this.Qa, n));
            return f;
          };
          c.prototype.Ob = function(f, l) {
            f = this.get(f, l);
            l = this.Db();
            for (var n = {}, p = 0; p < l.length; p += 1) n[l[p]] = f[p];
            return n;
          };
          c.prototype.lc = function() {
            return ib(this.Qa);
          };
          c.prototype.ic = function() {
            return jc(this.Qa);
          };
          c.prototype.Jb = function(f) {
            null != f && this.bind(f);
            this.step();
            return this.reset();
          };
          c.prototype.Lb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            f = ea(f);
            this.yb.push(f);
            this.db.handleError(kc(this.Qa, l, f, -1, 0));
          };
          c.prototype.Vb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            var n = ca(f.length);
            m.set(f, n);
            this.yb.push(n);
            this.db.handleError(kb(this.Qa, l, n, f.length, 0));
          };
          c.prototype.Kb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            this.db.handleError((f === (f | 0) ? mc : lc)(
              this.Qa,
              l,
              f
            ));
          };
          c.prototype.Yb = function(f) {
            null == f && (f = this.Oa, this.Oa += 1);
            kb(this.Qa, f, 0, 0, 0);
          };
          c.prototype.Mb = function(f, l) {
            null == l && (l = this.Oa, this.Oa += 1);
            switch (typeof f) {
              case "string":
                this.Lb(f, l);
                return;
              case "number":
                this.Kb(f, l);
                return;
              case "bigint":
                this.Lb(f.toString(), l);
                return;
              case "boolean":
                this.Kb(f + 0, l);
                return;
              case "object":
                if (null === f) {
                  this.Yb(l);
                  return;
                }
                if (null != f.length) {
                  this.Vb(f, l);
                  return;
                }
            }
            throw "Wrong API use : tried to bind a value of an unknown type (" + f + ").";
          };
          c.prototype.Xb = function(f) {
            var l = this;
            Object.keys(f).forEach(function(n) {
              var p = nc(l.Qa, n);
              0 !== p && l.Mb(f[n], p);
            });
            return true;
          };
          c.prototype.Wb = function(f) {
            for (var l = 0; l < f.length; l += 1) this.Mb(f[l], l + 1);
            return true;
          };
          c.prototype.reset = function() {
            this.Cb();
            return 0 === yc(this.Qa) && 0 === xc(this.Qa);
          };
          c.prototype.Cb = function() {
            for (var f; void 0 !== (f = this.yb.pop()); ) da(f);
          };
          c.prototype.cb = function() {
            this.Cb();
            var f = 0 === zc(this.Qa);
            delete this.db.pb[this.Qa];
            this.Qa = 0;
            return f;
          };
          d.prototype.next = function() {
            if (null === this.ob) return { done: true };
            null !== this.gb && (this.gb.cb(), this.gb = null);
            if (!this.db.db) throw this.Ab(), Error("Database closed");
            var f = oa(), l = y(4);
            pa(g);
            pa(l);
            try {
              this.db.handleError(jb(this.db.db, this.ub, -1, g, l));
              this.ub = r(l, "i32");
              var n = r(g, "i32");
              if (0 === n) return this.Ab(), { done: true };
              this.gb = new c(n, this.db);
              this.db.pb[n] = this.gb;
              return { value: this.gb, done: false };
            } catch (p) {
              throw this.Fb = z(this.ub), this.Ab(), p;
            } finally {
              qa(f);
            }
          };
          d.prototype.Ab = function() {
            da(this.ob);
            this.ob = null;
          };
          d.prototype.jc = function() {
            return null !== this.Fb ? this.Fb : z(this.ub);
          };
          "function" === typeof Symbol && "symbol" === typeof Symbol.iterator && (d.prototype[Symbol.iterator] = function() {
            return this;
          });
          e.prototype.Jb = function(f, l) {
            if (!this.db) throw "Database closed";
            if (l) {
              f = this.Gb(f, l);
              try {
                f.step();
              } finally {
                f.cb();
              }
            } else this.handleError(t(this.db, f, 0, 0, g));
            return this;
          };
          e.prototype.exec = function(f, l, n) {
            if (!this.db) throw "Database closed";
            var p = null, u = null, v = null;
            try {
              v = u = ea(f);
              var K = y(4);
              for (f = []; 0 !== r(v, "i8"); ) {
                pa(g);
                pa(K);
                this.handleError(jb(this.db, v, -1, g, K));
                var I = r(g, "i32");
                v = r(
                  K,
                  "i32"
                );
                if (0 !== I) {
                  var H = null;
                  p = new c(I, this);
                  for (null != l && p.bind(l); p.step(); ) null === H && (H = { columns: p.Db(), values: [] }, f.push(H)), H.values.push(p.get(null, n));
                  p.cb();
                }
              }
              return f;
            } catch (L) {
              throw p && p.cb(), L;
            } finally {
              u && da(u);
            }
          };
          e.prototype.ec = function(f, l, n, p, u) {
            "function" === typeof l && (p = n, n = l, l = void 0);
            f = this.Gb(f, l);
            try {
              for (; f.step(); ) n(f.Ob(null, u));
            } finally {
              f.cb();
            }
            if ("function" === typeof p) return p();
          };
          e.prototype.Gb = function(f, l) {
            pa(g);
            this.handleError(D(this.db, f, -1, g, 0));
            f = r(g, "i32");
            if (0 === f) throw "Nothing to prepare";
            var n = new c(f, this);
            null != l && n.bind(l);
            return this.pb[f] = n;
          };
          e.prototype.pc = function(f) {
            return new d(f, this);
          };
          e.prototype.fc = function() {
            Object.values(this.pb).forEach(function(l) {
              l.cb();
            });
            Object.values(this.Sa).forEach(A);
            this.Sa = {};
            this.handleError(w(this.db));
            var f = sa(this.filename);
            this.handleError(q(this.filename, g));
            this.db = r(g, "i32");
            hb(this.db);
            return f;
          };
          e.prototype.close = function() {
            null !== this.db && (Object.values(this.pb).forEach(function(f) {
              f.cb();
            }), Object.values(this.Sa).forEach(A), this.Sa = {}, this.fb && (A(this.fb), this.fb = void 0), this.handleError(w(this.db)), ta("/" + this.filename), this.db = null);
          };
          e.prototype.handleError = function(f) {
            if (0 === f) return null;
            f = pc(this.db);
            throw Error(f);
          };
          e.prototype.kc = function() {
            return x(this.db);
          };
          e.prototype.bc = function(f, l) {
            Object.prototype.hasOwnProperty.call(this.Sa, f) && (A(this.Sa[f]), delete this.Sa[f]);
            var n = ua(function(p, u, v) {
              u = b(u, v);
              try {
                var K = l.apply(null, u);
              } catch (I) {
                ra(p, I, -1);
                return;
              }
              a(p, K);
            }, "viii");
            this.Sa[f] = n;
            this.handleError(mb(
              this.db,
              f,
              l.length,
              1,
              0,
              n,
              0,
              0,
              0
            ));
            return this;
          };
          e.prototype.ac = function(f, l) {
            var n = l.init || function() {
              return null;
            }, p = l.finalize || function(H) {
              return H;
            }, u = l.step;
            if (!u) throw "An aggregate function must have a step function in " + f;
            var v = {};
            Object.hasOwnProperty.call(this.Sa, f) && (A(this.Sa[f]), delete this.Sa[f]);
            l = f + "__finalize";
            Object.hasOwnProperty.call(this.Sa, l) && (A(this.Sa[l]), delete this.Sa[l]);
            var K = ua(function(H, L, Ka) {
              var V = nb(H, 1);
              Object.hasOwnProperty.call(v, V) || (v[V] = n());
              L = b(L, Ka);
              L = [v[V]].concat(L);
              try {
                v[V] = u.apply(
                  null,
                  L
                );
              } catch (Bc) {
                delete v[V], ra(H, Bc, -1);
              }
            }, "viii"), I = ua(function(H) {
              var L = nb(H, 1);
              try {
                var Ka = p(v[L]);
              } catch (V) {
                delete v[L];
                ra(H, V, -1);
                return;
              }
              a(H, Ka);
              delete v[L];
            }, "vi");
            this.Sa[f] = K;
            this.Sa[l] = I;
            this.handleError(mb(this.db, f, u.length - 1, 1, 0, 0, K, I, 0));
            return this;
          };
          e.prototype.vc = function(f) {
            this.fb && (ob(this.db, 0, 0), A(this.fb), this.fb = void 0);
            if (!f) return this;
            this.fb = ua(function(l, n, p, u, v) {
              switch (n) {
                case 18:
                  l = "insert";
                  break;
                case 23:
                  l = "update";
                  break;
                case 9:
                  l = "delete";
                  break;
                default:
                  throw "unknown operationCode in updateHook callback: " + n;
              }
              p = z(p);
              u = z(u);
              if (v > Number.MAX_SAFE_INTEGER) throw "rowId too big to fit inside a Number";
              f(l, p, u, Number(v));
            }, "viiiij");
            ob(this.db, this.fb, 0);
            return this;
          };
          c.prototype.bind = c.prototype.bind;
          c.prototype.step = c.prototype.step;
          c.prototype.get = c.prototype.get;
          c.prototype.getColumnNames = c.prototype.Db;
          c.prototype.getAsObject = c.prototype.Ob;
          c.prototype.getSQL = c.prototype.lc;
          c.prototype.getNormalizedSQL = c.prototype.ic;
          c.prototype.run = c.prototype.Jb;
          c.prototype.reset = c.prototype.reset;
          c.prototype.freemem = c.prototype.Cb;
          c.prototype.free = c.prototype.cb;
          d.prototype.next = d.prototype.next;
          d.prototype.getRemainingSQL = d.prototype.jc;
          e.prototype.run = e.prototype.Jb;
          e.prototype.exec = e.prototype.exec;
          e.prototype.each = e.prototype.ec;
          e.prototype.prepare = e.prototype.Gb;
          e.prototype.iterateStatements = e.prototype.pc;
          e.prototype["export"] = e.prototype.fc;
          e.prototype.close = e.prototype.close;
          e.prototype.handleError = e.prototype.handleError;
          e.prototype.getRowsModified = e.prototype.kc;
          e.prototype.create_function = e.prototype.bc;
          e.prototype.create_aggregate = e.prototype.ac;
          e.prototype.updateHook = e.prototype.vc;
          k.Database = e;
        };
        var va = "./this.program", wa = globalThis.document?.currentScript?.src;
        ba && (wa = self.location.href);
        var xa = "", ya, za;
        if (aa || ba) {
          try {
            xa = new URL(".", wa).href;
          } catch {
          }
          ba && (za = (a) => {
            var b = new XMLHttpRequest();
            b.open("GET", a, false);
            b.responseType = "arraybuffer";
            b.send(null);
            return new Uint8Array(b.response);
          });
          ya = async (a) => {
            a = await fetch(a, { credentials: "same-origin" });
            if (a.ok) return a.arrayBuffer();
            throw Error(a.status + " : " + a.url);
          };
        }
        var Aa = console.log.bind(console), B = console.error.bind(console), Ba, Ca = false, Da, m, C, Ea, E, F, Fa, Ga, G;
        function Ha() {
          var a = Ia.buffer;
          m = new Int8Array(a);
          Ea = new Int16Array(a);
          C = new Uint8Array(a);
          new Uint16Array(a);
          E = new Int32Array(a);
          F = new Uint32Array(a);
          Fa = new Float32Array(a);
          Ga = new Float64Array(a);
          G = new BigInt64Array(a);
          new BigUint64Array(a);
        }
        function Ja(a) {
          k.onAbort?.(a);
          a = "Aborted(" + a + ")";
          B(a);
          Ca = true;
          throw new WebAssembly.RuntimeError(a + ". Build with -sASSERTIONS for more info.");
        }
        var La;
        async function Ma(a) {
          if (!Ba) try {
            var b = await ya(a);
            return new Uint8Array(b);
          } catch {
          }
          if (a == La && Ba) a = new Uint8Array(Ba);
          else if (za) a = za(a);
          else throw "both async and sync fetching of the wasm failed";
          return a;
        }
        async function Na(a, b) {
          try {
            var c = await Ma(a);
            return await WebAssembly.instantiate(c, b);
          } catch (d) {
            B(`failed to asynchronously prepare wasm: ${d}`), Ja(d);
          }
        }
        async function Oa(a) {
          var b = La;
          if (!Ba) try {
            var c = fetch(b, { credentials: "same-origin" });
            return await WebAssembly.instantiateStreaming(c, a);
          } catch (d) {
            B(`wasm streaming compile failed: ${d}`), B("falling back to ArrayBuffer instantiation");
          }
          return Na(b, a);
        }
        class Pa {
          constructor(a) {
            __publicField(this, "name", "ExitStatus");
            this.message = `Program terminated with exit(${a})`;
            this.status = a;
          }
        }
        var Qa = (a) => {
          for (; 0 < a.length; ) a.shift()(k);
        }, Ra = [], Sa = [], Ta = () => {
          var a = k.preRun.shift();
          Sa.push(a);
        }, J = 0, Ua = null;
        function r(a, b = "i8") {
          b.endsWith("*") && (b = "*");
          switch (b) {
            case "i1":
              return m[a];
            case "i8":
              return m[a];
            case "i16":
              return Ea[a >> 1];
            case "i32":
              return E[a >> 2];
            case "i64":
              return G[a >> 3];
            case "float":
              return Fa[a >> 2];
            case "double":
              return Ga[a >> 3];
            case "*":
              return F[a >> 2];
            default:
              Ja(`invalid type for getValue: ${b}`);
          }
        }
        var Va = true;
        function pa(a) {
          var b = "i32";
          b.endsWith("*") && (b = "*");
          switch (b) {
            case "i1":
              m[a] = 0;
              break;
            case "i8":
              m[a] = 0;
              break;
            case "i16":
              Ea[a >> 1] = 0;
              break;
            case "i32":
              E[a >> 2] = 0;
              break;
            case "i64":
              G[a >> 3] = BigInt(0);
              break;
            case "float":
              Fa[a >> 2] = 0;
              break;
            case "double":
              Ga[a >> 3] = 0;
              break;
            case "*":
              F[a >> 2] = 0;
              break;
            default:
              Ja(`invalid type for setValue: ${b}`);
          }
        }
        var Wa = new TextDecoder(), Xa = (a, b, c, d) => {
          c = b + c;
          if (d) return c;
          for (; a[b] && !(b >= c); ) ++b;
          return b;
        }, z = (a, b, c) => a ? Wa.decode(C.subarray(a, Xa(C, a, b, c))) : "", Ya = (a, b) => {
          for (var c = 0, d = a.length - 1; 0 <= d; d--) {
            var e = a[d];
            "." === e ? a.splice(d, 1) : ".." === e ? (a.splice(d, 1), c++) : c && (a.splice(d, 1), c--);
          }
          if (b) for (; c; c--) a.unshift("..");
          return a;
        }, ha = (a) => {
          var b = "/" === a.charAt(0), c = "/" === a.slice(-1);
          (a = Ya(a.split("/").filter((d) => !!d), !b).join("/")) || b || (a = ".");
          a && c && (a += "/");
          return (b ? "/" : "") + a;
        }, Za = (a) => {
          var b = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(a).slice(1);
          a = b[0];
          b = b[1];
          if (!a && !b) return ".";
          b && (b = b.slice(0, -1));
          return a + b;
        }, $a = (a) => a && a.match(/([^\/]+|\/)\/*$/)[1], ab = () => (a) => crypto.getRandomValues(a), bb = (a) => {
          (bb = ab())(a);
        }, cb = (...a) => {
          for (var b = "", c = false, d = a.length - 1; -1 <= d && !c; d--) {
            c = 0 <= d ? a[d] : "/";
            if ("string" != typeof c) throw new TypeError("Arguments to path.resolve must be strings");
            if (!c) return "";
            b = c + "/" + b;
            c = "/" === c.charAt(0);
          }
          b = Ya(b.split("/").filter((e) => !!e), !c).join("/");
          return (c ? "/" : "") + b || ".";
        }, db = (a) => {
          var b = Xa(a, 0);
          return Wa.decode(a.buffer ? a.subarray(0, b) : new Uint8Array(a.slice(0, b)));
        }, fb = [], gb = (a) => {
          for (var b = 0, c = 0; c < a.length; ++c) {
            var d = a.charCodeAt(c);
            127 >= d ? b++ : 2047 >= d ? b += 2 : 55296 <= d && 57343 >= d ? (b += 4, ++c) : b += 3;
          }
          return b;
        }, M = (a, b, c, d) => {
          if (!(0 < d)) return 0;
          var e = c;
          d = c + d - 1;
          for (var g = 0; g < a.length; ++g) {
            var h = a.codePointAt(g);
            if (127 >= h) {
              if (c >= d) break;
              b[c++] = h;
            } else if (2047 >= h) {
              if (c + 1 >= d) break;
              b[c++] = 192 | h >> 6;
              b[c++] = 128 | h & 63;
            } else if (65535 >= h) {
              if (c + 2 >= d) break;
              b[c++] = 224 | h >> 12;
              b[c++] = 128 | h >> 6 & 63;
              b[c++] = 128 | h & 63;
            } else {
              if (c + 3 >= d) break;
              b[c++] = 240 | h >> 18;
              b[c++] = 128 | h >> 12 & 63;
              b[c++] = 128 | h >> 6 & 63;
              b[c++] = 128 | h & 63;
              g++;
            }
          }
          b[c] = 0;
          return c - e;
        }, pb = [];
        function qb(a, b) {
          pb[a] = { input: [], output: [], kb: b };
          rb(a, sb);
        }
        var sb = { open(a) {
          var b = pb[a.node.nb];
          if (!b) throw new N(43);
          a.Va = b;
          a.seekable = false;
        }, close(a) {
          a.Va.kb.lb(a.Va);
        }, lb(a) {
          a.Va.kb.lb(a.Va);
        }, read(a, b, c, d) {
          if (!a.Va || !a.Va.kb.Qb) throw new N(60);
          for (var e = 0, g = 0; g < d; g++) {
            try {
              var h = a.Va.kb.Qb(a.Va);
            } catch (q) {
              throw new N(29);
            }
            if (void 0 === h && 0 === e) throw new N(6);
            if (null === h || void 0 === h) break;
            e++;
            b[c + g] = h;
          }
          e && (a.node.$a = Date.now());
          return e;
        }, write(a, b, c, d) {
          if (!a.Va || !a.Va.kb.Hb) throw new N(60);
          try {
            for (var e = 0; e < d; e++) a.Va.kb.Hb(a.Va, b[c + e]);
          } catch (g) {
            throw new N(29);
          }
          d && (a.node.Ua = a.node.Ta = Date.now());
          return e;
        } }, tb = { Qb() {
          a: {
            if (!fb.length) {
              var a = null;
              globalThis.window?.prompt && (a = window.prompt("Input: "), null !== a && (a += "\n"));
              if (!a) {
                var b = null;
                break a;
              }
              b = Array(gb(a) + 1);
              a = M(a, b, 0, b.length);
              b.length = a;
              fb = b;
            }
            b = fb.shift();
          }
          return b;
        }, Hb(a, b) {
          null === b || 10 === b ? (Aa(db(a.output)), a.output = []) : 0 != b && a.output.push(b);
        }, lb(a) {
          0 < a.output?.length && (Aa(db(a.output)), a.output = []);
        }, Dc() {
          return { yc: 25856, Ac: 5, xc: 191, zc: 35387, wc: [
            3,
            28,
            127,
            21,
            4,
            0,
            1,
            0,
            17,
            19,
            26,
            0,
            18,
            15,
            23,
            22,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
          ] };
        }, Ec() {
          return 0;
        }, Fc() {
          return [24, 80];
        } }, ub = { Hb(a, b) {
          null === b || 10 === b ? (B(db(a.output)), a.output = []) : 0 != b && a.output.push(b);
        }, lb(a) {
          0 < a.output?.length && (B(db(a.output)), a.output = []);
        } }, O = { Za: null, ab() {
          return O.createNode(null, "/", 16895, 0);
        }, createNode(a, b, c, d) {
          if (24576 === (c & 61440) || 4096 === (c & 61440)) throw new N(63);
          O.Za || (O.Za = { dir: { node: { Wa: O.La.Wa, Xa: O.La.Xa, mb: O.La.mb, rb: O.La.rb, Tb: O.La.Tb, xb: O.La.xb, vb: O.La.vb, Ib: O.La.Ib, wb: O.La.wb }, stream: { Ya: O.Ma.Ya } }, file: {
            node: { Wa: O.La.Wa, Xa: O.La.Xa },
            stream: { Ya: O.Ma.Ya, read: O.Ma.read, write: O.Ma.write, sb: O.Ma.sb, tb: O.Ma.tb }
          }, link: { node: { Wa: O.La.Wa, Xa: O.La.Xa, eb: O.La.eb }, stream: {} }, Nb: { node: { Wa: O.La.Wa, Xa: O.La.Xa }, stream: vb } });
          c = wb(a, b, c, d);
          P(c.mode) ? (c.La = O.Za.dir.node, c.Ma = O.Za.dir.stream, c.Na = {}) : 32768 === (c.mode & 61440) ? (c.La = O.Za.file.node, c.Ma = O.Za.file.stream, c.Ra = 0, c.Na = null) : 40960 === (c.mode & 61440) ? (c.La = O.Za.link.node, c.Ma = O.Za.link.stream) : 8192 === (c.mode & 61440) && (c.La = O.Za.Nb.node, c.Ma = O.Za.Nb.stream);
          c.$a = c.Ua = c.Ta = Date.now();
          a && (a.Na[b] = c, a.$a = a.Ua = a.Ta = c.$a);
          return c;
        }, Cc(a) {
          return a.Na ? a.Na.subarray ? a.Na.subarray(0, a.Ra) : new Uint8Array(a.Na) : new Uint8Array(0);
        }, La: { Wa(a) {
          var b = {};
          b.cc = 8192 === (a.mode & 61440) ? a.id : 1;
          b.oc = a.id;
          b.mode = a.mode;
          b.rc = 1;
          b.uid = 0;
          b.nc = 0;
          b.nb = a.nb;
          P(a.mode) ? b.size = 4096 : 32768 === (a.mode & 61440) ? b.size = a.Ra : 40960 === (a.mode & 61440) ? b.size = a.link.length : b.size = 0;
          b.$a = new Date(a.$a);
          b.Ua = new Date(a.Ua);
          b.Ta = new Date(a.Ta);
          b.Zb = 4096;
          b.$b = Math.ceil(b.size / b.Zb);
          return b;
        }, Xa(a, b) {
          for (var c of ["mode", "atime", "mtime", "ctime"]) null != b[c] && (a[c] = b[c]);
          void 0 !== b.size && (b = b.size, a.Ra != b && (0 == b ? (a.Na = null, a.Ra = 0) : (c = a.Na, a.Na = new Uint8Array(b), c && a.Na.set(c.subarray(0, Math.min(b, a.Ra))), a.Ra = b)));
        }, mb() {
          O.zb || (O.zb = new N(44), O.zb.stack = "<generic error, no stack>");
          throw O.zb;
        }, rb(a, b, c, d) {
          return O.createNode(a, b, c, d);
        }, Tb(a, b, c) {
          try {
            var d = Q(b, c);
          } catch (g) {
          }
          if (d) {
            if (P(a.mode)) for (var e in d.Na) throw new N(55);
            xb(d);
          }
          delete a.parent.Na[a.name];
          b.Na[c] = a;
          a.name = c;
          b.Ta = b.Ua = a.parent.Ta = a.parent.Ua = Date.now();
        }, xb(a, b) {
          delete a.Na[b];
          a.Ta = a.Ua = Date.now();
        }, vb(a, b) {
          var c = Q(a, b), d;
          for (d in c.Na) throw new N(55);
          delete a.Na[b];
          a.Ta = a.Ua = Date.now();
        }, Ib(a) {
          return [".", "..", ...Object.keys(a.Na)];
        }, wb(a, b, c) {
          a = O.createNode(a, b, 41471, 0);
          a.link = c;
          return a;
        }, eb(a) {
          if (40960 !== (a.mode & 61440)) throw new N(28);
          return a.link;
        } }, Ma: { read(a, b, c, d, e) {
          var g = a.node.Na;
          if (e >= a.node.Ra) return 0;
          a = Math.min(a.node.Ra - e, d);
          if (8 < a && g.subarray) b.set(g.subarray(e, e + a), c);
          else for (d = 0; d < a; d++) b[c + d] = g[e + d];
          return a;
        }, write(a, b, c, d, e, g) {
          b.buffer === m.buffer && (g = false);
          if (!d) return 0;
          a = a.node;
          a.Ua = a.Ta = Date.now();
          if (b.subarray && (!a.Na || a.Na.subarray)) {
            if (g) return a.Na = b.subarray(c, c + d), a.Ra = d;
            if (0 === a.Ra && 0 === e) return a.Na = b.slice(c, c + d), a.Ra = d;
            if (e + d <= a.Ra) return a.Na.set(b.subarray(c, c + d), e), d;
          }
          g = e + d;
          var h = a.Na ? a.Na.length : 0;
          h >= g || (g = Math.max(g, h * (1048576 > h ? 2 : 1.125) >>> 0), 0 != h && (g = Math.max(g, 256)), h = a.Na, a.Na = new Uint8Array(g), 0 < a.Ra && a.Na.set(h.subarray(0, a.Ra), 0));
          if (a.Na.subarray && b.subarray) a.Na.set(b.subarray(c, c + d), e);
          else for (g = 0; g < d; g++) a.Na[e + g] = b[c + g];
          a.Ra = Math.max(
            a.Ra,
            e + d
          );
          return d;
        }, Ya(a, b, c) {
          1 === c ? b += a.position : 2 === c && 32768 === (a.node.mode & 61440) && (b += a.node.Ra);
          if (0 > b) throw new N(28);
          return b;
        }, sb(a, b, c, d, e) {
          if (32768 !== (a.node.mode & 61440)) throw new N(43);
          a = a.node.Na;
          if (e & 2 || !a || a.buffer !== m.buffer) {
            e = true;
            d = 65536 * Math.ceil(b / 65536);
            var g = yb(65536, d);
            g && C.fill(0, g, g + d);
            d = g;
            if (!d) throw new N(48);
            if (a) {
              if (0 < c || c + b < a.length) a.subarray ? a = a.subarray(c, c + b) : a = Array.prototype.slice.call(a, c, c + b);
              m.set(a, d);
            }
          } else e = false, d = a.byteOffset;
          return { tc: d, Ub: e };
        }, tb(a, b, c, d) {
          O.Ma.write(
            a,
            b,
            0,
            d,
            c,
            false
          );
          return 0;
        } } }, ia = (a, b) => {
          var c = 0;
          a && (c |= 365);
          b && (c |= 146);
          return c;
        }, zb = null, Ab = {}, Bb = [], Cb = 1, R = null, Db = false, Eb = true, N = class {
          constructor(a) {
            __publicField(this, "name", "ErrnoError");
            this.Pa = a;
          }
        }, Fb = class {
          constructor() {
            __publicField(this, "qb", {});
            __publicField(this, "node", null);
          }
          get flags() {
            return this.qb.flags;
          }
          set flags(a) {
            this.qb.flags = a;
          }
          get position() {
            return this.qb.position;
          }
          set position(a) {
            this.qb.position = a;
          }
        }, Gb = class {
          constructor(a, b, c, d) {
            __publicField(this, "La", {});
            __publicField(this, "Ma", {});
            __publicField(this, "ib", null);
            a || (a = this);
            this.parent = a;
            this.ab = a.ab;
            this.id = Cb++;
            this.name = b;
            this.mode = c;
            this.nb = d;
            this.$a = this.Ua = this.Ta = Date.now();
          }
          get read() {
            return 365 === (this.mode & 365);
          }
          set read(a) {
            a ? this.mode |= 365 : this.mode &= -366;
          }
          get write() {
            return 146 === (this.mode & 146);
          }
          set write(a) {
            a ? this.mode |= 146 : this.mode &= -147;
          }
        };
        function S(a, b = {}) {
          if (!a) throw new N(44);
          b.Bb ?? (b.Bb = true);
          "/" === a.charAt(0) || (a = "//" + a);
          var c = 0;
          a: for (; 40 > c; c++) {
            a = a.split("/").filter((q) => !!q);
            for (var d = zb, e = "/", g = 0; g < a.length; g++) {
              var h = g === a.length - 1;
              if (h && b.parent) break;
              if ("." !== a[g]) if (".." === a[g]) if (e = Za(e), d === d.parent) {
                a = e + "/" + a.slice(g + 1).join("/");
                c--;
                continue a;
              } else d = d.parent;
              else {
                e = ha(e + "/" + a[g]);
                try {
                  d = Q(d, a[g]);
                } catch (q) {
                  if (44 === q?.Pa && h && b.sc) return { path: e };
                  throw q;
                }
                !d.ib || h && !b.Bb || (d = d.ib.root);
                if (40960 === (d.mode & 61440) && (!h || b.hb)) {
                  if (!d.La.eb) throw new N(52);
                  d = d.La.eb(d);
                  "/" === d.charAt(0) || (d = Za(e) + "/" + d);
                  a = d + "/" + a.slice(g + 1).join("/");
                  continue a;
                }
              }
            }
            return { path: e, node: d };
          }
          throw new N(32);
        }
        function fa(a) {
          for (var b; ; ) {
            if (a === a.parent) return a = a.ab.Sb, b ? "/" !== a[a.length - 1] ? `${a}/${b}` : a + b : a;
            b = b ? `${a.name}/${b}` : a.name;
            a = a.parent;
          }
        }
        function Hb(a, b) {
          for (var c = 0, d = 0; d < b.length; d++) c = (c << 5) - c + b.charCodeAt(d) | 0;
          return (a + c >>> 0) % R.length;
        }
        function xb(a) {
          var b = Hb(a.parent.id, a.name);
          if (R[b] === a) R[b] = a.jb;
          else for (b = R[b]; b; ) {
            if (b.jb === a) {
              b.jb = a.jb;
              break;
            }
            b = b.jb;
          }
        }
        function Q(a, b) {
          var c = P(a.mode) ? (c = Ib(a, "x")) ? c : a.La.mb ? 0 : 2 : 54;
          if (c) throw new N(c);
          for (c = R[Hb(a.id, b)]; c; c = c.jb) {
            var d = c.name;
            if (c.parent.id === a.id && d === b) return c;
          }
          return a.La.mb(a, b);
        }
        function wb(a, b, c, d) {
          a = new Gb(a, b, c, d);
          b = Hb(a.parent.id, a.name);
          a.jb = R[b];
          return R[b] = a;
        }
        function P(a) {
          return 16384 === (a & 61440);
        }
        function Ib(a, b) {
          return Eb ? 0 : b.includes("r") && !(a.mode & 292) || b.includes("w") && !(a.mode & 146) || b.includes("x") && !(a.mode & 73) ? 2 : 0;
        }
        function Jb(a, b) {
          if (!P(a.mode)) return 54;
          try {
            return Q(a, b), 20;
          } catch (c) {
          }
          return Ib(a, "wx");
        }
        function Kb(a, b, c) {
          try {
            var d = Q(a, b);
          } catch (e) {
            return e.Pa;
          }
          if (a = Ib(a, "wx")) return a;
          if (c) {
            if (!P(d.mode)) return 54;
            if (d === d.parent || "/" === fa(d)) return 10;
          } else if (P(d.mode)) return 31;
          return 0;
        }
        function Lb(a) {
          if (!a) throw new N(63);
          return a;
        }
        function T(a) {
          a = Bb[a];
          if (!a) throw new N(8);
          return a;
        }
        function Mb(a, b = -1) {
          a = Object.assign(new Fb(), a);
          if (-1 == b) a: {
            for (b = 0; 4096 >= b; b++) if (!Bb[b]) break a;
            throw new N(33);
          }
          a.bb = b;
          return Bb[b] = a;
        }
        function Nb(a, b = -1) {
          a = Mb(a, b);
          a.Ma?.Bc?.(a);
          return a;
        }
        function Ob(a, b, c) {
          var d = a?.Ma.Xa;
          a = d ? a : b;
          d ?? (d = b.La.Xa);
          Lb(d);
          d(a, c);
        }
        var vb = { open(a) {
          a.Ma = Ab[a.node.nb].Ma;
          a.Ma.open?.(a);
        }, Ya() {
          throw new N(70);
        } };
        function rb(a, b) {
          Ab[a] = { Ma: b };
        }
        function Pb(a, b) {
          var c = "/" === b;
          if (c && zb) throw new N(10);
          if (!c && b) {
            var d = S(b, { Bb: false });
            b = d.path;
            d = d.node;
            if (d.ib) throw new N(10);
            if (!P(d.mode)) throw new N(54);
          }
          b = { type: a, Gc: {}, Sb: b, qc: [] };
          a = a.ab(b);
          a.ab = b;
          b.root = a;
          c ? zb = a : d && (d.ib = b, d.ab && d.ab.qc.push(b));
        }
        function Qb(a, b, c) {
          var d = S(a, { parent: true }).node;
          a = $a(a);
          if (!a) throw new N(28);
          if ("." === a || ".." === a) throw new N(20);
          var e = Jb(d, a);
          if (e) throw new N(e);
          if (!d.La.rb) throw new N(63);
          return d.La.rb(d, a, b, c);
        }
        function ja(a, b = 438) {
          return Qb(a, b & 4095 | 32768, 0);
        }
        function U(a, b = 511) {
          return Qb(a, b & 1023 | 16384, 0);
        }
        function Rb(a, b, c) {
          "undefined" == typeof c && (c = b, b = 438);
          Qb(a, b | 8192, c);
        }
        function Sb(a, b) {
          if (!cb(a)) throw new N(44);
          var c = S(b, { parent: true }).node;
          if (!c) throw new N(44);
          b = $a(b);
          var d = Jb(c, b);
          if (d) throw new N(d);
          if (!c.La.wb) throw new N(63);
          c.La.wb(c, b, a);
        }
        function Tb(a) {
          var b = S(a, { parent: true }).node;
          a = $a(a);
          var c = Q(b, a), d = Kb(b, a, true);
          if (d) throw new N(d);
          if (!b.La.vb) throw new N(63);
          if (c.ib) throw new N(10);
          b.La.vb(b, a);
          xb(c);
        }
        function ta(a) {
          var b = S(a, { parent: true }).node;
          if (!b) throw new N(44);
          a = $a(a);
          var c = Q(b, a), d = Kb(b, a, false);
          if (d) throw new N(d);
          if (!b.La.xb) throw new N(63);
          if (c.ib) throw new N(10);
          b.La.xb(b, a);
          xb(c);
        }
        function Ub(a, b) {
          a = S(a, { hb: !b }).node;
          return Lb(a.La.Wa)(a);
        }
        function Vb(a, b, c, d) {
          Ob(a, b, { mode: c & 4095 | b.mode & -4096, Ta: Date.now(), dc: d });
        }
        function ka(a, b) {
          a = "string" == typeof a ? S(a, { hb: true }).node : a;
          Vb(null, a, b);
        }
        function Wb(a, b, c) {
          if (P(b.mode)) throw new N(31);
          if (32768 !== (b.mode & 61440)) throw new N(28);
          var d = Ib(b, "w");
          if (d) throw new N(d);
          Ob(a, b, { size: c, timestamp: Date.now() });
        }
        function la(a, b, c = 438) {
          if ("" === a) throw new N(44);
          if ("string" == typeof b) {
            var d = { r: 0, "r+": 2, w: 577, "w+": 578, a: 1089, "a+": 1090 }[b];
            if ("undefined" == typeof d) throw Error(`Unknown file open mode: ${b}`);
            b = d;
          }
          c = b & 64 ? c & 4095 | 32768 : 0;
          if ("object" == typeof a) d = a;
          else {
            var e = a.endsWith("/");
            var g = S(a, { hb: !(b & 131072), sc: true });
            d = g.node;
            a = g.path;
          }
          g = false;
          if (b & 64) if (d) {
            if (b & 128) throw new N(20);
          } else {
            if (e) throw new N(31);
            d = Qb(a, c | 511, 0);
            g = true;
          }
          if (!d) throw new N(44);
          8192 === (d.mode & 61440) && (b &= -513);
          if (b & 65536 && !P(d.mode)) throw new N(54);
          if (!g && (d ? 40960 === (d.mode & 61440) ? e = 32 : (e = ["r", "w", "rw"][b & 3], b & 512 && (e += "w"), e = P(d.mode) && ("r" !== e || b & 576) ? 31 : Ib(d, e)) : e = 44, e)) throw new N(e);
          b & 512 && !g && (e = d, e = "string" == typeof e ? S(e, { hb: true }).node : e, Wb(null, e, 0));
          b = Mb({ node: d, path: fa(d), flags: b & -131713, seekable: true, position: 0, Ma: d.Ma, uc: [], error: false });
          b.Ma.open && b.Ma.open(b);
          g && ka(d, c & 511);
          return b;
        }
        function na(a) {
          if (null === a.bb) throw new N(8);
          a.Eb && (a.Eb = null);
          try {
            a.Ma.close && a.Ma.close(a);
          } catch (b) {
            throw b;
          } finally {
            Bb[a.bb] = null;
          }
          a.bb = null;
        }
        function Xb(a, b, c) {
          if (null === a.bb) throw new N(8);
          if (!a.seekable || !a.Ma.Ya) throw new N(70);
          if (0 != c && 1 != c && 2 != c) throw new N(28);
          a.position = a.Ma.Ya(a, b, c);
          a.uc = [];
        }
        function Yb(a, b, c, d, e) {
          if (0 > d || 0 > e) throw new N(28);
          if (null === a.bb) throw new N(8);
          if (1 === (a.flags & 2097155)) throw new N(8);
          if (P(a.node.mode)) throw new N(31);
          if (!a.Ma.read) throw new N(28);
          var g = "undefined" != typeof e;
          if (!g) e = a.position;
          else if (!a.seekable) throw new N(70);
          b = a.Ma.read(a, b, c, d, e);
          g || (a.position += b);
          return b;
        }
        function ma(a, b, c, d, e) {
          if (0 > d || 0 > e) throw new N(28);
          if (null === a.bb) throw new N(8);
          if (0 === (a.flags & 2097155)) throw new N(8);
          if (P(a.node.mode)) throw new N(31);
          if (!a.Ma.write) throw new N(28);
          a.seekable && a.flags & 1024 && Xb(a, 0, 2);
          var g = "undefined" != typeof e;
          if (!g) e = a.position;
          else if (!a.seekable) throw new N(70);
          b = a.Ma.write(a, b, c, d, e, void 0);
          g || (a.position += b);
          return b;
        }
        function sa(a) {
          var b = b || 0;
          var c = "binary";
          "utf8" !== c && "binary" !== c && Ja(`Invalid encoding type "${c}"`);
          b = la(a, b);
          a = Ub(a).size;
          var d = new Uint8Array(a);
          Yb(b, d, 0, a, 0);
          "utf8" === c && (d = db(d));
          na(b);
          return d;
        }
        function W(a, b, c) {
          a = ha("/dev/" + a);
          var d = ia(!!b, !!c);
          W.Rb ?? (W.Rb = 64);
          var e = W.Rb++ << 8 | 0;
          rb(e, { open(g) {
            g.seekable = false;
          }, close() {
            c?.buffer?.length && c(10);
          }, read(g, h, q, w) {
            for (var t = 0, x = 0; x < w; x++) {
              try {
                var D = b();
              } catch (ib) {
                throw new N(29);
              }
              if (void 0 === D && 0 === t) throw new N(6);
              if (null === D || void 0 === D) break;
              t++;
              h[q + x] = D;
            }
            t && (g.node.$a = Date.now());
            return t;
          }, write(g, h, q, w) {
            for (var t = 0; t < w; t++) try {
              c(h[q + t]);
            } catch (x) {
              throw new N(29);
            }
            w && (g.node.Ua = g.node.Ta = Date.now());
            return t;
          } });
          Rb(a, d, e);
        }
        var X = {};
        function Y(a, b, c) {
          if ("/" === b.charAt(0)) return b;
          a = -100 === a ? "/" : T(a).path;
          if (0 == b.length) {
            if (!c) throw new N(44);
            return a;
          }
          return a + "/" + b;
        }
        function Zb(a, b) {
          F[a >> 2] = b.cc;
          F[a + 4 >> 2] = b.mode;
          F[a + 8 >> 2] = b.rc;
          F[a + 12 >> 2] = b.uid;
          F[a + 16 >> 2] = b.nc;
          F[a + 20 >> 2] = b.nb;
          G[a + 24 >> 3] = BigInt(b.size);
          E[a + 32 >> 2] = 4096;
          E[a + 36 >> 2] = b.$b;
          var c = b.$a.getTime(), d = b.Ua.getTime(), e = b.Ta.getTime();
          G[a + 40 >> 3] = BigInt(Math.floor(c / 1e3));
          F[a + 48 >> 2] = c % 1e3 * 1e6;
          G[a + 56 >> 3] = BigInt(Math.floor(d / 1e3));
          F[a + 64 >> 2] = d % 1e3 * 1e6;
          G[a + 72 >> 3] = BigInt(Math.floor(e / 1e3));
          F[a + 80 >> 2] = e % 1e3 * 1e6;
          G[a + 88 >> 3] = BigInt(b.oc);
          return 0;
        }
        var ic = void 0, Ac = () => {
          var a = E[+ic >> 2];
          ic += 4;
          return a;
        }, Cc = 0, Dc = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335], Ec = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334], Fc = {}, Gc = (a) => {
          if (!(a instanceof Pa || "unwind" == a)) throw a;
        }, Hc = (a) => {
          Da = a;
          Va || 0 < Cc || (k.onExit?.(a), Ca = true);
          throw new Pa(a);
        }, Ic = (a) => {
          if (!Ca) try {
            a();
          } catch (b) {
            Gc(b);
          } finally {
            if (!(Va || 0 < Cc)) try {
              Da = a = Da, Hc(a);
            } catch (b) {
              Gc(b);
            }
          }
        }, Jc = {}, Lc = () => {
          if (!Kc) {
            var a = { USER: "web_user", LOGNAME: "web_user", PATH: "/", PWD: "/", HOME: "/home/web_user", LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8", _: va || "./this.program" }, b;
            for (b in Jc) void 0 === Jc[b] ? delete a[b] : a[b] = Jc[b];
            var c = [];
            for (b in a) c.push(`${b}=${a[b]}`);
            Kc = c;
          }
          return Kc;
        }, Kc, Mc = (a, b, c, d) => {
          var e = { string: (t) => {
            var x = 0;
            if (null !== t && void 0 !== t && 0 !== t) {
              x = gb(t) + 1;
              var D = y(x);
              M(t, C, D, x);
              x = D;
            }
            return x;
          }, array: (t) => {
            var x = y(t.length);
            m.set(t, x);
            return x;
          } };
          a = k["_" + a];
          var g = [], h = 0;
          if (d) for (var q = 0; q < d.length; q++) {
            var w = e[c[q]];
            w ? (0 === h && (h = oa()), g[q] = w(d[q])) : g[q] = d[q];
          }
          c = a(...g);
          return c = (function(t) {
            0 !== h && qa(h);
            return "string" === b ? z(t) : "boolean" === b ? !!t : t;
          })(c);
        }, ea = (a) => {
          var b = gb(a) + 1, c = ca(b);
          c && M(a, C, c, b);
          return c;
        }, Nc, Oc = [], A = (a) => {
          Nc.delete(Z.get(a));
          Z.set(a, null);
          Oc.push(a);
        }, Pc = (a) => {
          const b = a.length;
          return [b % 128 | 128, b >> 7, ...a];
        }, Qc = { i: 127, p: 127, j: 126, f: 125, d: 124, e: 111 }, Rc = (a) => Pc(Array.from(a, (b) => Qc[b])), ua = (a, b) => {
          if (!Nc) {
            Nc = /* @__PURE__ */ new WeakMap();
            var c = Z.length;
            if (Nc) for (var d = 0; d < 0 + c; d++) {
              var e = Z.get(d);
              e && Nc.set(e, d);
            }
          }
          if (c = Nc.get(a) || 0) return c;
          c = Oc.length ? Oc.pop() : Z.grow(1);
          try {
            Z.set(c, a);
          } catch (g) {
            if (!(g instanceof TypeError)) throw g;
            b = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...Pc([1, 96, ...Rc(b.slice(1)), ...Rc("v" === b[0] ? "" : b[0])]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
            b = new WebAssembly.Module(b);
            b = new WebAssembly.Instance(b, { e: { f: a } }).exports.f;
            Z.set(c, b);
          }
          Nc.set(a, c);
          return c;
        };
        R = Array(4096);
        Pb(O, "/");
        U("/tmp");
        U("/home");
        U("/home/web_user");
        (function() {
          U("/dev");
          rb(259, { read: () => 0, write: (d, e, g, h) => h, Ya: () => 0 });
          Rb("/dev/null", 259);
          qb(1280, tb);
          qb(1536, ub);
          Rb("/dev/tty", 1280);
          Rb("/dev/tty1", 1536);
          var a = new Uint8Array(1024), b = 0, c = () => {
            0 === b && (bb(a), b = a.byteLength);
            return a[--b];
          };
          W("random", c);
          W("urandom", c);
          U("/dev/shm");
          U("/dev/shm/tmp");
        })();
        (function() {
          U("/proc");
          var a = U("/proc/self");
          U("/proc/self/fd");
          Pb({ ab() {
            var b = wb(a, "fd", 16895, 73);
            b.Ma = { Ya: O.Ma.Ya };
            b.La = { mb(c, d) {
              c = +d;
              var e = T(c);
              c = { parent: null, ab: { Sb: "fake" }, La: { eb: () => e.path }, id: c + 1 };
              return c.parent = c;
            }, Ib() {
              return Array.from(Bb.entries()).filter(([, c]) => c).map(([c]) => c.toString());
            } };
            return b;
          } }, "/proc/self/fd");
        })();
        k.noExitRuntime && (Va = k.noExitRuntime);
        k.print && (Aa = k.print);
        k.printErr && (B = k.printErr);
        k.wasmBinary && (Ba = k.wasmBinary);
        k.thisProgram && (va = k.thisProgram);
        if (k.preInit) for ("function" == typeof k.preInit && (k.preInit = [k.preInit]); 0 < k.preInit.length; ) k.preInit.shift()();
        k.stackSave = () => oa();
        k.stackRestore = (a) => qa(a);
        k.stackAlloc = (a) => y(a);
        k.cwrap = (a, b, c, d) => {
          var e = !c || c.every((g) => "number" === g || "boolean" === g);
          return "string" !== b && e && !d ? k["_" + a] : (...g) => Mc(a, b, c, g);
        };
        k.addFunction = ua;
        k.removeFunction = A;
        k.UTF8ToString = z;
        k.stringToNewUTF8 = ea;
        k.writeArrayToMemory = (a, b) => {
          m.set(a, b);
        };
        var ca, da, yb, Sc, qa, y, oa, Ia, Z, Tc = {
          a: (a, b, c, d) => Ja(`Assertion failed: ${z(a)}, at: ` + [b ? z(b) : "unknown filename", c, d ? z(d) : "unknown function"]),
          i: function(a, b) {
            try {
              return a = z(a), ka(a, b), 0;
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name) throw c;
              return -c.Pa;
            }
          },
          L: function(a, b, c) {
            try {
              b = z(b);
              b = Y(a, b);
              if (c & -8) return -28;
              var d = S(b, { hb: true }).node;
              if (!d) return -44;
              a = "";
              c & 4 && (a += "r");
              c & 2 && (a += "w");
              c & 1 && (a += "x");
              return a && Ib(d, a) ? -2 : 0;
            } catch (e) {
              if ("undefined" == typeof X || "ErrnoError" !== e.name) throw e;
              return -e.Pa;
            }
          },
          j: function(a, b) {
            try {
              var c = T(a);
              Vb(c, c.node, b, false);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name) throw d;
              return -d.Pa;
            }
          },
          h: function(a) {
            try {
              var b = T(a);
              Ob(b, b.node, { timestamp: Date.now(), dc: false });
              return 0;
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name) throw c;
              return -c.Pa;
            }
          },
          b: function(a, b, c) {
            ic = c;
            try {
              var d = T(a);
              switch (b) {
                case 0:
                  var e = Ac();
                  if (0 > e) break;
                  for (; Bb[e]; ) e++;
                  return Nb(d, e).bb;
                case 1:
                case 2:
                  return 0;
                case 3:
                  return d.flags;
                case 4:
                  return e = Ac(), d.flags |= e, 0;
                case 12:
                  return e = Ac(), Ea[e + 0 >> 1] = 2, 0;
                case 13:
                case 14:
                  return 0;
              }
              return -28;
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name) throw g;
              return -g.Pa;
            }
          },
          g: function(a, b) {
            try {
              var c = T(a), d = c.node, e = c.Ma.Wa;
              a = e ? c : d;
              e ?? (e = d.La.Wa);
              Lb(e);
              var g = e(a);
              return Zb(b, g);
            } catch (h) {
              if ("undefined" == typeof X || "ErrnoError" !== h.name) throw h;
              return -h.Pa;
            }
          },
          H: function(a, b) {
            b = -9007199254740992 > b || 9007199254740992 < b ? NaN : Number(b);
            try {
              if (isNaN(b)) return -61;
              var c = T(a);
              if (0 > b || 0 === (c.flags & 2097155)) throw new N(28);
              Wb(c, c.node, b);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name) throw d;
              return -d.Pa;
            }
          },
          G: function(a, b) {
            try {
              if (0 === b) return -28;
              var c = gb("/") + 1;
              if (b < c) return -68;
              M("/", C, a, b);
              return c;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name) throw d;
              return -d.Pa;
            }
          },
          K: function(a, b) {
            try {
              return a = z(a), Zb(b, Ub(a, true));
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name) throw c;
              return -c.Pa;
            }
          },
          C: function(a, b, c) {
            try {
              return b = z(b), b = Y(a, b), U(b, c), 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name) throw d;
              return -d.Pa;
            }
          },
          J: function(a, b, c, d) {
            try {
              b = z(b);
              var e = d & 256;
              b = Y(a, b, d & 4096);
              return Zb(c, e ? Ub(b, true) : Ub(b));
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name) throw g;
              return -g.Pa;
            }
          },
          x: function(a, b, c, d) {
            ic = d;
            try {
              b = z(b);
              b = Y(a, b);
              var e = d ? Ac() : 0;
              return la(b, c, e).bb;
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name) throw g;
              return -g.Pa;
            }
          },
          v: function(a, b, c, d) {
            try {
              b = z(b);
              b = Y(a, b);
              if (0 >= d) return -28;
              var e = S(b).node;
              if (!e) throw new N(44);
              if (!e.La.eb) throw new N(28);
              var g = e.La.eb(e);
              var h = Math.min(d, gb(g)), q = m[c + h];
              M(g, C, c, d + 1);
              m[c + h] = q;
              return h;
            } catch (w) {
              if ("undefined" == typeof X || "ErrnoError" !== w.name) throw w;
              return -w.Pa;
            }
          },
          u: function(a) {
            try {
              return a = z(a), Tb(a), 0;
            } catch (b) {
              if ("undefined" == typeof X || "ErrnoError" !== b.name) throw b;
              return -b.Pa;
            }
          },
          f: function(a, b) {
            try {
              return a = z(a), Zb(b, Ub(a));
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name) throw c;
              return -c.Pa;
            }
          },
          r: function(a, b, c) {
            try {
              b = z(b);
              b = Y(a, b);
              if (c) if (512 === c) Tb(b);
              else return -28;
              else ta(b);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name) throw d;
              return -d.Pa;
            }
          },
          q: function(a, b, c) {
            try {
              b = z(b);
              b = Y(a, b, true);
              var d = Date.now(), e, g;
              if (c) {
                var h = F[c >> 2] + 4294967296 * E[c + 4 >> 2], q = E[c + 8 >> 2];
                1073741823 == q ? e = d : 1073741822 == q ? e = null : e = 1e3 * h + q / 1e6;
                c += 16;
                h = F[c >> 2] + 4294967296 * E[c + 4 >> 2];
                q = E[c + 8 >> 2];
                1073741823 == q ? g = d : 1073741822 == q ? g = null : g = 1e3 * h + q / 1e6;
              } else g = e = d;
              if (null !== (g ?? e)) {
                a = e;
                var w = S(b, { hb: true }).node;
                Lb(w.La.Xa)(w, { $a: a, Ua: g });
              }
              return 0;
            } catch (t) {
              if ("undefined" == typeof X || "ErrnoError" !== t.name) throw t;
              return -t.Pa;
            }
          },
          m: () => Ja(""),
          l: () => {
            Va = false;
            Cc = 0;
          },
          A: function(a, b) {
            a = -9007199254740992 > a || 9007199254740992 < a ? NaN : Number(a);
            a = new Date(1e3 * a);
            E[b >> 2] = a.getSeconds();
            E[b + 4 >> 2] = a.getMinutes();
            E[b + 8 >> 2] = a.getHours();
            E[b + 12 >> 2] = a.getDate();
            E[b + 16 >> 2] = a.getMonth();
            E[b + 20 >> 2] = a.getFullYear() - 1900;
            E[b + 24 >> 2] = a.getDay();
            var c = a.getFullYear();
            E[b + 28 >> 2] = (0 !== c % 4 || 0 === c % 100 && 0 !== c % 400 ? Ec : Dc)[a.getMonth()] + a.getDate() - 1 | 0;
            E[b + 36 >> 2] = -(60 * a.getTimezoneOffset());
            c = new Date(a.getFullYear(), 6, 1).getTimezoneOffset();
            var d = new Date(a.getFullYear(), 0, 1).getTimezoneOffset();
            E[b + 32 >> 2] = (c != d && a.getTimezoneOffset() == Math.min(d, c)) | 0;
          },
          y: function(a, b, c, d, e, g, h) {
            e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e);
            try {
              var q = T(d);
              if (0 !== (b & 2) && 0 === (c & 2) && 2 !== (q.flags & 2097155)) throw new N(2);
              if (1 === (q.flags & 2097155)) throw new N(2);
              if (!q.Ma.sb) throw new N(43);
              if (!a) throw new N(28);
              var w = q.Ma.sb(q, a, e, b, c);
              var t = w.tc;
              E[g >> 2] = w.Ub;
              F[h >> 2] = t;
              return 0;
            } catch (x) {
              if ("undefined" == typeof X || "ErrnoError" !== x.name) throw x;
              return -x.Pa;
            }
          },
          z: function(a, b, c, d, e, g) {
            g = -9007199254740992 > g || 9007199254740992 < g ? NaN : Number(g);
            try {
              var h = T(e);
              if (c & 2) {
                if (32768 !== (h.node.mode & 61440)) throw new N(43);
                d & 2 || h.Ma.tb && h.Ma.tb(h, C.slice(a, a + b), g, b, d);
              }
            } catch (q) {
              if ("undefined" == typeof X || "ErrnoError" !== q.name) throw q;
              return -q.Pa;
            }
          },
          n: (a, b) => {
            Fc[a] && (clearTimeout(Fc[a].id), delete Fc[a]);
            if (!b) return 0;
            var c = setTimeout(() => {
              delete Fc[a];
              Ic(() => Sc(a, performance.now()));
            }, b);
            Fc[a] = { id: c, Hc: b };
            return 0;
          },
          B: (a, b, c, d) => {
            var e = (/* @__PURE__ */ new Date()).getFullYear(), g = new Date(e, 0, 1).getTimezoneOffset();
            e = new Date(e, 6, 1).getTimezoneOffset();
            F[a >> 2] = 60 * Math.max(g, e);
            E[b >> 2] = Number(g != e);
            b = (h) => {
              var q = Math.abs(h);
              return `UTC${0 <= h ? "-" : "+"}${String(Math.floor(q / 60)).padStart(2, "0")}${String(q % 60).padStart(2, "0")}`;
            };
            a = b(g);
            b = b(e);
            e < g ? (M(a, C, c, 17), M(b, C, d, 17)) : (M(a, C, d, 17), M(b, C, c, 17));
          },
          d: () => Date.now(),
          s: () => 2147483648,
          c: () => performance.now(),
          o: (a) => {
            var b = C.length;
            a >>>= 0;
            if (2147483648 < a) return false;
            for (var c = 1; 4 >= c; c *= 2) {
              var d = b * (1 + 0.2 / c);
              d = Math.min(d, a + 100663296);
              a: {
                d = (Math.min(2147483648, 65536 * Math.ceil(Math.max(a, d) / 65536)) - Ia.buffer.byteLength + 65535) / 65536 | 0;
                try {
                  Ia.grow(d);
                  Ha();
                  var e = 1;
                  break a;
                } catch (g) {
                }
                e = void 0;
              }
              if (e) return true;
            }
            return false;
          },
          E: (a, b) => {
            var c = 0, d = 0, e;
            for (e of Lc()) {
              var g = b + c;
              F[a + d >> 2] = g;
              c += M(e, C, g, Infinity) + 1;
              d += 4;
            }
            return 0;
          },
          F: (a, b) => {
            var c = Lc();
            F[a >> 2] = c.length;
            a = 0;
            for (var d of c) a += gb(d) + 1;
            F[b >> 2] = a;
            return 0;
          },
          e: function(a) {
            try {
              var b = T(a);
              na(b);
              return 0;
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name) throw c;
              return c.Pa;
            }
          },
          p: function(a, b) {
            try {
              var c = T(a);
              m[b] = c.Va ? 2 : P(c.mode) ? 3 : 40960 === (c.mode & 61440) ? 7 : 4;
              Ea[b + 2 >> 1] = 0;
              G[b + 8 >> 3] = BigInt(0);
              G[b + 16 >> 3] = BigInt(0);
              return 0;
            } catch (d) {
              if ("undefined" == typeof X || "ErrnoError" !== d.name) throw d;
              return d.Pa;
            }
          },
          w: function(a, b, c, d) {
            try {
              a: {
                var e = T(a);
                a = b;
                for (var g, h = b = 0; h < c; h++) {
                  var q = F[a >> 2], w = F[a + 4 >> 2];
                  a += 8;
                  var t = Yb(e, m, q, w, g);
                  if (0 > t) {
                    var x = -1;
                    break a;
                  }
                  b += t;
                  if (t < w) break;
                  "undefined" != typeof g && (g += t);
                }
                x = b;
              }
              F[d >> 2] = x;
              return 0;
            } catch (D) {
              if ("undefined" == typeof X || "ErrnoError" !== D.name) throw D;
              return D.Pa;
            }
          },
          D: function(a, b, c, d) {
            b = -9007199254740992 > b || 9007199254740992 < b ? NaN : Number(b);
            try {
              if (isNaN(b)) return 61;
              var e = T(a);
              Xb(e, b, c);
              G[d >> 3] = BigInt(e.position);
              e.Eb && 0 === b && 0 === c && (e.Eb = null);
              return 0;
            } catch (g) {
              if ("undefined" == typeof X || "ErrnoError" !== g.name) throw g;
              return g.Pa;
            }
          },
          I: function(a) {
            try {
              var b = T(a);
              return b.Ma?.lb?.(b);
            } catch (c) {
              if ("undefined" == typeof X || "ErrnoError" !== c.name) throw c;
              return c.Pa;
            }
          },
          t: function(a, b, c, d) {
            try {
              a: {
                var e = T(a);
                a = b;
                for (var g, h = b = 0; h < c; h++) {
                  var q = F[a >> 2], w = F[a + 4 >> 2];
                  a += 8;
                  var t = ma(e, m, q, w, g);
                  if (0 > t) {
                    var x = -1;
                    break a;
                  }
                  b += t;
                  if (t < w) break;
                  "undefined" != typeof g && (g += t);
                }
                x = b;
              }
              F[d >> 2] = x;
              return 0;
            } catch (D) {
              if ("undefined" == typeof X || "ErrnoError" !== D.name) throw D;
              return D.Pa;
            }
          },
          k: Hc
        };
        function Uc() {
          function a() {
            k.calledRun = true;
            if (!Ca) {
              if (!k.noFSInit && !Db) {
                var b, c;
                Db = true;
                b ?? (b = k.stdin);
                c ?? (c = k.stdout);
                d ?? (d = k.stderr);
                b ? W("stdin", b) : Sb("/dev/tty", "/dev/stdin");
                c ? W("stdout", null, c) : Sb("/dev/tty", "/dev/stdout");
                d ? W("stderr", null, d) : Sb("/dev/tty1", "/dev/stderr");
                la("/dev/stdin", 0);
                la("/dev/stdout", 1);
                la("/dev/stderr", 1);
              }
              Vc.N();
              Eb = false;
              k.onRuntimeInitialized?.();
              if (k.postRun) for ("function" == typeof k.postRun && (k.postRun = [k.postRun]); k.postRun.length; ) {
                var d = k.postRun.shift();
                Ra.push(d);
              }
              Qa(Ra);
            }
          }
          if (0 < J) Ua = Uc;
          else {
            if (k.preRun) for ("function" == typeof k.preRun && (k.preRun = [k.preRun]); k.preRun.length; ) Ta();
            Qa(Sa);
            0 < J ? Ua = Uc : k.setStatus ? (k.setStatus("Running..."), setTimeout(() => {
              setTimeout(() => k.setStatus(""), 1);
              a();
            }, 1)) : a();
          }
        }
        var Vc;
        (async function() {
          function a(c) {
            c = Vc = c.exports;
            k._sqlite3_free = c.P;
            k._sqlite3_value_text = c.Q;
            k._sqlite3_prepare_v2 = c.R;
            k._sqlite3_step = c.S;
            k._sqlite3_reset = c.T;
            k._sqlite3_exec = c.U;
            k._sqlite3_finalize = c.V;
            k._sqlite3_column_name = c.W;
            k._sqlite3_column_text = c.X;
            k._sqlite3_column_type = c.Y;
            k._sqlite3_errmsg = c.Z;
            k._sqlite3_clear_bindings = c._;
            k._sqlite3_value_blob = c.$;
            k._sqlite3_value_bytes = c.aa;
            k._sqlite3_value_double = c.ba;
            k._sqlite3_value_int = c.ca;
            k._sqlite3_value_type = c.da;
            k._sqlite3_result_blob = c.ea;
            k._sqlite3_result_double = c.fa;
            k._sqlite3_result_error = c.ga;
            k._sqlite3_result_int = c.ha;
            k._sqlite3_result_int64 = c.ia;
            k._sqlite3_result_null = c.ja;
            k._sqlite3_result_text = c.ka;
            k._sqlite3_aggregate_context = c.la;
            k._sqlite3_column_count = c.ma;
            k._sqlite3_data_count = c.na;
            k._sqlite3_column_blob = c.oa;
            k._sqlite3_column_bytes = c.pa;
            k._sqlite3_column_double = c.qa;
            k._sqlite3_bind_blob = c.ra;
            k._sqlite3_bind_double = c.sa;
            k._sqlite3_bind_int = c.ta;
            k._sqlite3_bind_text = c.ua;
            k._sqlite3_bind_parameter_index = c.va;
            k._sqlite3_sql = c.wa;
            k._sqlite3_normalized_sql = c.xa;
            k._sqlite3_changes = c.ya;
            k._sqlite3_close_v2 = c.za;
            k._sqlite3_create_function_v2 = c.Aa;
            k._sqlite3_update_hook = c.Ba;
            k._sqlite3_open = c.Ca;
            ca = k._malloc = c.Da;
            da = k._free = c.Ea;
            k._RegisterExtensionFunctions = c.Fa;
            yb = c.Ga;
            Sc = c.Ha;
            qa = c.Ia;
            y = c.Ja;
            oa = c.Ka;
            Ia = c.M;
            Z = c.O;
            Ha();
            J--;
            k.monitorRunDependencies?.(J);
            0 == J && Ua && (c = Ua, Ua = null, c());
            return Vc;
          }
          J++;
          k.monitorRunDependencies?.(J);
          var b = { a: Tc };
          if (k.instantiateWasm) return new Promise((c) => {
            k.instantiateWasm(b, (d, e) => {
              c(a(d, e));
            });
          });
          La ?? (La = k.locateFile ? k.locateFile("sql-wasm-browser.wasm", xa) : xa + "sql-wasm-browser.wasm");
          return a((await Oa(b)).instance);
        })();
        Uc();
        return Module;
      });
      return initSqlJsPromise;
    };
    if (typeof exports === "object" && typeof module2 === "object") {
      module2.exports = initSqlJs2;
      module2.exports.default = initSqlJs2;
    } else if (typeof define === "function" && define["amd"]) {
      define([], function() {
        return initSqlJs2;
      });
    } else if (typeof exports === "object") {
      exports["Module"] = initSqlJs2;
    }
  }
});

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SQLiteTreeHierarchyPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var import_sql = __toESM(require_sql_wasm_browser());
var VIEW_TYPE_TREE_HIERARCHY = "sqlite-tree-hierarchy-view";
var DEFAULT_DB_FILENAME = "tree-hierarchy.sqlite";
var DEFAULT_SETTINGS = {
  dbFileName: DEFAULT_DB_FILENAME,
  backupDbPath: "",
  noteRootFolder: ""
};
function fireAndForget(task, onError) {
  void task.catch((error) => {
    if (onError) {
      onError(error);
      return;
    }
    console.error(error);
  });
}
function toArrayBuffer(data) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return buffer;
}
var TreeHierarchyStore = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.sql = null;
    this.db = null;
  }
  async initialize() {
    if (this.db) {
      return;
    }
    const adapter = this.plugin.app.vault.adapter;
    const pluginDir = this.plugin.getPluginDirectory();
    const wasmPath = (0, import_obsidian.normalizePath)(`${pluginDir}/sql-wasm.wasm`);
    const wasmBinary = new Uint8Array(await adapter.readBinary(wasmPath));
    const sql = await (0, import_sql.default)({ wasmBinary });
    this.sql = sql;
    await this.ensureDbDirectory(adapter);
    await this.restorePrimaryFromBackupIfNeeded(adapter);
    const dbPath = this.plugin.getDatabasePath();
    if (await adapter.exists(dbPath)) {
      const binary = new Uint8Array(await adapter.readBinary(dbPath));
      this.db = new sql.Database(binary);
    } else {
      this.db = new sql.Database();
    }
    this.ensureSchema();
    await this.save();
  }
  ensureSchema() {
    this.db?.exec(`
			CREATE TABLE IF NOT EXISTS nodes (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				parent_id INTEGER NULL REFERENCES nodes(id) ON DELETE CASCADE,
				type TEXT NOT NULL CHECK(type IN ('group', 'note')),
				title TEXT NOT NULL,
				note_path TEXT NULL,
				sort_order INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
		`);
    if (!this.hasColumn("nodes", "sort_order")) {
      this.db?.exec(`ALTER TABLE nodes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;`);
    }
    this.db?.exec(`
			UPDATE nodes
			SET sort_order = id
			WHERE sort_order = 0;
		`);
  }
  async save() {
    if (!this.db) {
      return;
    }
    const adapter = this.plugin.app.vault.adapter;
    const fileData = this.exportDatabaseBytes();
    await adapter.writeBinary(this.plugin.getDatabasePath(), toArrayBuffer(fileData));
  }
  async ensureDbDirectory(adapter) {
    const dir = this.plugin.getDatabaseDirectory();
    if (!await adapter.exists(dir)) {
      await adapter.mkdir(dir);
    }
  }
  async restorePrimaryFromBackupIfNeeded(adapter) {
    const primaryPath = this.plugin.getDatabasePath();
    if (await adapter.exists(primaryPath)) {
      return;
    }
    const backupBytes = await this.plugin.readBackupDatabase();
    if (!backupBytes) {
      return;
    }
    await adapter.writeBinary(primaryPath, toArrayBuffer(backupBytes));
    new import_obsidian.Notice("Hierarchy view restored its database from the backup location.");
  }
  exportDatabaseBytes() {
    if (!this.db) {
      throw new Error("Database is not initialized.");
    }
    return new Uint8Array(this.db.export());
  }
  getTree() {
    const result = this.db?.exec(`
			SELECT id, parent_id, type, title, note_path, sort_order
			FROM nodes
			ORDER BY COALESCE(parent_id, -1), sort_order ASC, id ASC;
		`) ?? [];
    if (result.length === 0) {
      return [];
    }
    const rows = result[0].values;
    const byId = /* @__PURE__ */ new Map();
    const roots = [];
    for (const row of rows) {
      const node = {
        id: Number(row[0]),
        parentId: row[1] === null ? null : Number(row[1]),
        type: String(row[2]),
        title: String(row[3]),
        notePath: row[4] === null ? null : String(row[4]),
        sortOrder: Number(row[5]),
        children: []
      };
      byId.set(node.id, node);
    }
    for (const node of byId.values()) {
      if (node.parentId === null) {
        roots.push(node);
        continue;
      }
      const parent = byId.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
  async createGroup(title, parentId) {
    const createdId = this.runInsert("group", title, parentId, null);
    await this.save();
    return createdId;
  }
  async createNoteNode(title, parentId, notePath) {
    const createdId = this.runInsert("note", title, parentId, notePath);
    await this.save();
    return createdId;
  }
  async assignExistingNote(title, parentId, notePath) {
    const existingNodeId = this.findNoteNodeIdByPath(notePath);
    if (existingNodeId !== null) {
      this.db?.run(
        `UPDATE nodes
				 SET title = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
        [title, existingNodeId]
      );
      await this.moveNode(existingNodeId, parentId);
    } else {
      this.runInsert("note", title, parentId, notePath);
      await this.save();
    }
  }
  async ensureTrackedNote(title, notePath) {
    const existingNodeId = this.findNoteNodeIdByPath(notePath);
    if (existingNodeId !== null) {
      return existingNodeId;
    }
    this.runInsert("note", title, null, notePath);
    const createdId = this.findNoteNodeIdByPath(notePath);
    if (createdId === null) {
      throw new Error("Failed to track existing note.");
    }
    await this.save();
    return createdId;
  }
  async syncVaultNotes() {
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      const existingNodeId = this.findNoteNodeIdByPath(file.path);
      if (existingNodeId === null) {
        this.runInsert("note", file.path, null, file.path);
        continue;
      }
      this.db?.run(
        `UPDATE nodes
				 SET title = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
        [file.path, existingNodeId]
      );
    }
    await this.save();
  }
  async unassignNote(notePath) {
    const nodeId = this.findNoteNodeIdByPath(notePath);
    if (nodeId === null) {
      return;
    }
    await this.moveNodeToIndex(nodeId, null, null);
  }
  async moveNode(nodeId, parentId) {
    await this.moveNodeToIndex(nodeId, parentId, null);
  }
  async moveNodeToIndex(nodeId, parentId, index) {
    const node = this.getNodeById(nodeId);
    if (!node) {
      return;
    }
    const previousParentId = node.parentId;
    if (parentId !== null) {
      const target = this.getNodeById(parentId);
      if (!target || target.type !== "group") {
        if (target?.type !== "note") {
          throw new Error("Target parent must be an existing node.");
        }
      }
      if (this.isDescendant(parentId, nodeId) || parentId === nodeId) {
        throw new Error("A node cannot be moved into itself or one of its descendants.");
      }
    }
    const siblingIds = this.getSiblingIds(parentId).filter((id) => id !== nodeId);
    const boundedIndex = index === null ? siblingIds.length : Math.max(0, Math.min(index, siblingIds.length));
    siblingIds.splice(boundedIndex, 0, nodeId);
    this.db?.run(
      `UPDATE nodes
			 SET parent_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
			 WHERE id = ?`,
      [parentId, boundedIndex + 1, nodeId]
    );
    if (previousParentId !== parentId) {
      this.rewriteSiblingOrder(previousParentId, this.getSiblingIds(previousParentId).filter((id) => id !== nodeId));
    }
    this.rewriteSiblingOrder(parentId, siblingIds);
    await this.save();
  }
  getParentTargets(excludeNodeId) {
    const targets = [];
    const walk = (nodes, prefix = "") => {
      for (const node of nodes) {
        if (excludeNodeId !== void 0) {
          if (node.id === excludeNodeId) {
            continue;
          }
          if (this.isDescendant(node.id, excludeNodeId)) {
            continue;
          }
        }
        targets.push({
          id: node.id,
          label: prefix ? `${prefix} / ${node.title}` : node.title
        });
        walk(node.children, prefix ? `${prefix} / ${node.title}` : node.title);
      }
    };
    walk(this.getTree());
    return targets;
  }
  runInsert(type, title, parentId, notePath) {
    const sortOrder = this.getNextSortOrder(parentId);
    this.db?.run(
      `INSERT INTO nodes(parent_id, type, title, note_path, sort_order, updated_at)
			 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [parentId, type, title, notePath, sortOrder]
    );
    const inserted = this.db?.exec("SELECT last_insert_rowid();") ?? [];
    if (inserted.length === 0 || inserted[0].values.length === 0) {
      throw new Error("Failed to read inserted node id.");
    }
    return Number(inserted[0].values[0][0]);
  }
  findNoteNodeIdByPath(notePath) {
    if (!this.db) {
      return null;
    }
    const statement = this.db.prepare(
      `SELECT id
			 FROM nodes
			 WHERE type = 'note' AND note_path = ?
			 LIMIT 1`
    );
    try {
      statement.bind([notePath]);
      if (!statement.step()) {
        return null;
      }
      const row = statement.getAsObject();
      return typeof row.id === "number" ? row.id : Number(row.id);
    } finally {
      statement.free();
    }
  }
  getNodeById(nodeId) {
    if (!this.db) {
      return null;
    }
    const statement = this.db.prepare(
      `SELECT id, parent_id, type, title, note_path, sort_order
			 FROM nodes
			 WHERE id = ?
			 LIMIT 1`
    );
    try {
      statement.bind([nodeId]);
      if (!statement.step()) {
        return null;
      }
      const row = statement.getAsObject();
      return {
        id: Number(row.id),
        parentId: row.parent_id === null ? null : Number(row.parent_id),
        type: String(row.type),
        title: String(row.title),
        notePath: row.note_path === null ? null : String(row.note_path),
        sortOrder: Number(row.sort_order),
        children: []
      };
    } finally {
      statement.free();
    }
  }
  getNextSortOrder(parentId) {
    const siblingIds = this.getSiblingIds(parentId);
    return siblingIds.length + 1;
  }
  getSiblingIds(parentId) {
    const statement = this.db?.prepare(
      `SELECT id
			 FROM nodes
			 WHERE parent_id IS ?
			 ORDER BY sort_order ASC, id ASC`
    );
    if (!statement) {
      return [];
    }
    try {
      statement.bind([parentId]);
      const ids = [];
      while (statement.step()) {
        const row = statement.getAsObject();
        ids.push(Number(row.id));
      }
      return ids;
    } finally {
      statement.free();
    }
  }
  rewriteSiblingOrder(parentId, siblingIds) {
    siblingIds.forEach((id, index) => {
      this.db?.run(
        `UPDATE nodes
				 SET parent_id = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ?`,
        [parentId, index + 1, id]
      );
    });
  }
  hasColumn(tableName, columnName) {
    const result = this.db?.exec(`PRAGMA table_info(${tableName});`) ?? [];
    if (result.length === 0) {
      return false;
    }
    return result[0].values.some((row) => String(row[1]) === columnName);
  }
  isDescendant(nodeId, ancestorId) {
    let current = this.getNodeById(nodeId);
    while (current?.parentId !== null && current?.parentId !== void 0) {
      if (current.parentId === ancestorId) {
        return true;
      }
      current = this.getNodeById(current.parentId);
    }
    return false;
  }
};
var CreateHierarchyItemModal = class extends import_obsidian.Modal {
  constructor(app, plugin, type, parentId) {
    super(app);
    this.plugin = plugin;
    this.type = type;
    this.parentId = parentId;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tree-hierarchy-modal");
    this.titleEl.setText(this.type === "group" ? "Create hierarchy group" : "Create note");
    let title = "";
    const titleLabel = contentEl.createEl("label", { text: this.type === "group" ? "Group name" : "Note title" });
    const titleInput = titleLabel.createEl("input", { type: "text" });
    titleInput.focus();
    titleInput.addEventListener("input", () => {
      title = titleInput.value.trim();
    });
    let folder = this.plugin.settings.noteRootFolder.trim();
    if (this.type === "note") {
      const folderLabel = contentEl.createEl("label", { text: "Vault folder" });
      const folderInput = folderLabel.createEl("input", { type: "text", value: folder });
      folderInput.addEventListener("input", () => {
        folder = folderInput.value.trim();
      });
    }
    const createButton = contentEl.createEl("button", {
      text: this.type === "group" ? "Create group" : "Create note"
    });
    createButton.addEventListener("click", () => {
      fireAndForget(this.handleCreate(title, folder), (error) => {
        console.error(error);
        new import_obsidian.Notice("Failed to create hierarchy item.");
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  async handleCreate(title, folder) {
    if (!title) {
      new import_obsidian.Notice("Title is required.");
      return;
    }
    if (this.type === "group") {
      await this.plugin.store.createGroup(title, this.parentId);
    } else {
      await this.plugin.createNoteInHierarchy(title, this.parentId, folder);
    }
    this.close();
    await this.plugin.refreshTreeView();
  }
};
var AssignExistingNoteModal = class extends import_obsidian.Modal {
  constructor(app, plugin, parentId) {
    super(app);
    this.plugin = plugin;
    this.parentId = parentId;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tree-hierarchy-modal");
    this.titleEl.setText("Add existing note");
    const notes = this.plugin.getRootAttachableNotes();
    if (notes.length === 0) {
      contentEl.createEl("p", { text: "No root notes are available to attach." });
      return;
    }
    let selectedPath = notes[0].path;
    const label = contentEl.createEl("label", { text: "Choose a note" });
    const select = label.createEl("select");
    for (const note of notes) {
      select.createEl("option", {
        value: note.path,
        text: note.path
      });
    }
    select.addEventListener("change", () => {
      selectedPath = select.value;
    });
    const createButton = contentEl.createEl("button", { text: "Add to hierarchy" });
    createButton.addEventListener("click", () => {
      fireAndForget(this.handleAssign(selectedPath), (error) => {
        console.error(error);
        new import_obsidian.Notice("Failed to add existing note.");
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  async handleAssign(selectedPath) {
    const file = this.app.vault.getAbstractFileByPath(selectedPath);
    if (!(file instanceof import_obsidian.TFile)) {
      new import_obsidian.Notice("Selected note could not be found.");
      return;
    }
    await this.plugin.store.assignExistingNote(file.path, this.parentId, file.path);
    this.close();
    await this.plugin.refreshTreeView();
  }
};
var MoveHierarchyNodeModal = class extends import_obsidian.Modal {
  constructor(app, plugin, node) {
    super(app);
    this.plugin = plugin;
    this.node = node;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tree-hierarchy-modal");
    this.titleEl.setText(`Move ${this.node.type}`);
    const targets = this.plugin.store.getParentTargets(this.node.dbId ?? void 0);
    let selectedParent = targets[0]?.id ?? null;
    const label = contentEl.createEl("label", { text: "Target parent" });
    const select = label.createEl("select");
    select.createEl("option", {
      value: "",
      text: "Root level"
    });
    for (const target of targets) {
      select.createEl("option", {
        value: String(target.id),
        text: target.label
      });
    }
    select.addEventListener("change", () => {
      selectedParent = select.value ? Number(select.value) : null;
    });
    const moveButton = contentEl.createEl("button", { text: "Apply" });
    moveButton.addEventListener("click", () => {
      fireAndForget(this.handleMove(selectedParent), (error) => {
        console.error(error);
        new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  async handleMove(selectedParent) {
    if (this.node.dbId === null && this.node.notePath) {
      const file = this.app.vault.getAbstractFileByPath(this.node.notePath);
      if (!(file instanceof import_obsidian.TFile)) {
        new import_obsidian.Notice("Note file no longer exists.");
        return;
      }
      await this.plugin.store.assignExistingNote(file.path, selectedParent, file.path);
    } else if (this.node.dbId !== null) {
      await this.plugin.store.moveNode(this.node.dbId, selectedParent);
    }
    this.close();
    await this.plugin.refreshTreeView();
  }
};
var CreateParentHierarchyItemModal = class extends import_obsidian.Modal {
  constructor(app, plugin, type, targetNode) {
    super(app);
    this.plugin = plugin;
    this.type = type;
    this.targetNode = targetNode;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("tree-hierarchy-modal");
    this.titleEl.setText(this.type === "group" ? "Create parent group" : "Create parent note");
    let title = "";
    const titleLabel = contentEl.createEl("label", {
      text: this.type === "group" ? "Parent group name" : "Parent note title"
    });
    const titleInput = titleLabel.createEl("input", { type: "text" });
    titleInput.focus();
    titleInput.addEventListener("input", () => {
      title = titleInput.value.trim();
    });
    let folder = this.plugin.settings.noteRootFolder.trim();
    if (this.type === "note") {
      const folderLabel = contentEl.createEl("label", { text: "Vault folder" });
      const folderInput = folderLabel.createEl("input", { type: "text", value: folder });
      folderInput.addEventListener("input", () => {
        folder = folderInput.value.trim();
      });
    }
    const createButton = contentEl.createEl("button", {
      text: this.type === "group" ? "Create parent group" : "Create parent note"
    });
    createButton.addEventListener("click", () => {
      fireAndForget(this.handleCreate(title, folder), (error) => {
        console.error(error);
        new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to create parent item.");
      });
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  async handleCreate(title, folder) {
    if (!title) {
      new import_obsidian.Notice("Title is required.");
      return;
    }
    await this.plugin.createParentForNode(this.targetNode, this.type, title, folder);
    this.close();
    await this.plugin.refreshTreeView();
  }
};
var TreeHierarchyPopupModal = class extends import_obsidian.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.collapsed = /* @__PURE__ */ new Set();
    this.draggedNodeKey = null;
    this.treeScrollTop = 0;
  }
  onOpen() {
    this.containerEl.addClass("tree-hierarchy-popup-modal");
    this.buildChrome();
    window.requestAnimationFrame(() => {
      fireAndForget(this.render(), (error) => {
        console.error("Failed to render hierarchy popup", error);
      });
    });
  }
  onClose() {
    this.contentEl.empty();
    this.containerEl.removeClass("tree-hierarchy-popup-modal");
    this.plugin.onPopupClosed(this);
  }
  buildChrome() {
    this.titleEl.empty();
    this.titleEl.addClass("tree-hierarchy-popup-title");
    const titleText = this.titleEl.createSpan({ text: "Hierarchy view" });
    titleText.addClass("tree-hierarchy-popup-title-text");
    const controls = this.titleEl.createDiv({ cls: "tree-hierarchy-popup-controls" });
    const closeButton = controls.createEl("button", { text: "Close" });
    closeButton.addEventListener("click", () => this.close());
  }
  async render() {
    try {
      await this.plugin.whenReady();
      await this.plugin.store.syncVaultNotes();
      const container = this.contentEl;
      const previousTree = container.querySelector(".tree-hierarchy-tree");
      if (previousTree instanceof HTMLElement) {
        this.treeScrollTop = previousTree.scrollTop;
      }
      container.empty();
      container.addClass("tree-hierarchy-view");
      const toolbar = container.createDiv({ cls: "tree-hierarchy-toolbar" });
      const addRootGroupButton = toolbar.createEl("button", { text: "New root group" });
      addRootGroupButton.addEventListener("click", () => {
        new CreateHierarchyItemModal(this.app, this.plugin, "group", null).open();
      });
      const addRootNoteButton = toolbar.createEl("button", { text: "New root note" });
      addRootNoteButton.addEventListener("click", () => {
        new CreateHierarchyItemModal(this.app, this.plugin, "note", null).open();
      });
      const treeWrapper = container.createDiv({ cls: "tree-hierarchy-tree" });
      treeWrapper.scrollTop = this.treeScrollTop;
      this.registerRootDropZone(treeWrapper);
      treeWrapper.createDiv({
        cls: "tree-hierarchy-dropzone",
        text: "Drop here to move to root"
      });
      const tree = this.plugin.getDisplayTree();
      if (tree.length === 0) {
        treeWrapper.createDiv({
          cls: "tree-hierarchy-empty",
          text: "No hierarchy yet. Create a group, create a note, or assign an existing vault note."
        });
        return;
      }
      for (const node of tree) {
        this.renderNode(treeWrapper, node);
      }
      window.requestAnimationFrame(() => {
        treeWrapper.scrollTop = this.treeScrollTop;
      });
    } catch (error) {
      console.error("Failed to render hierarchy popup", error);
      this.contentEl.empty();
      this.contentEl.createEl("div", {
        cls: "tree-hierarchy-empty",
        text: "Failed to render hierarchy popup. Check the developer console."
      });
    }
  }
  renderNode(parentEl, node) {
    const nodeEl = parentEl.createDiv({ cls: "tree-hierarchy-node" });
    const beforeDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
    this.registerInsertDropZone(beforeDropZone, node, "before");
    const header = nodeEl.createDiv({ cls: "tree-hierarchy-node-header" });
    header.draggable = true;
    header.addEventListener("dragstart", (event) => {
      this.draggedNodeKey = node.key;
      header.addClass("is-dragging");
      event.dataTransfer?.setData("text/plain", node.key);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
      }
    });
    header.addEventListener("dragend", () => {
      this.draggedNodeKey = null;
      header.removeClass("is-dragging");
      this.clearDropIndicators();
    });
    if (node.children.length > 0) {
      const toggle = header.createEl("button", {
        cls: "tree-hierarchy-node-toggle",
        text: this.collapsed.has(node.dbId ?? this.hashNodeKey(node.key)) ? "+" : "-"
      });
      toggle.addEventListener("click", () => {
        fireAndForget(this.toggleCollapsed(node));
      });
    } else {
      header.createSpan({ cls: "tree-hierarchy-node-toggle", text: "" });
    }
    const label = header.createEl("button", {
      cls: `tree-hierarchy-node-label ${node.type === "note" ? "is-note" : ""}`,
      text: node.title
    });
    label.addEventListener("click", () => {
      fireAndForget(this.openNodeFile(node));
    });
    header.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.openNodeContextMenu(event, node);
    });
    const actions = header.createDiv({ cls: "tree-hierarchy-node-actions" });
    if (node.dbId !== null || node.type === "note" && node.notePath) {
      header.addClass("is-drop-target");
      header.addEventListener("dragover", (event) => {
        if (!this.canDrop(node)) {
          return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }
        header.addClass("is-drop-active");
      });
      header.addEventListener("dragleave", () => {
        header.removeClass("is-drop-active");
      });
      header.addEventListener("drop", (event) => {
        header.removeClass("is-drop-active");
        if (!this.canDrop(node)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        fireAndForget(this.dropOnNode(node), (error) => {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
        });
      });
      const addGroup = actions.createEl("button", { text: "+G" });
      addGroup.addEventListener("click", () => {
        fireAndForget(this.plugin.openCreateModalForNode("group", node), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open create group dialog.");
        });
      });
      const addNote = actions.createEl("button", { text: "+N" });
      addNote.addEventListener("click", () => {
        fireAndForget(this.plugin.openCreateModalForNode("note", node), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open create note dialog.");
        });
      });
      const addExisting = actions.createEl("button", { text: "+E" });
      addExisting.addEventListener("click", () => {
        fireAndForget(this.plugin.openAssignExistingModalForNode(node), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open add existing note dialog.");
        });
      });
      if (node.dbId !== null) {
        const moveNode = actions.createEl("button", { text: "Move" });
        moveNode.addEventListener("click", () => {
          new MoveHierarchyNodeModal(this.app, this.plugin, node).open();
        });
      }
    }
    const popupNodeId = node.dbId;
    if (node.type === "note" && node.notePath && popupNodeId !== null && node.parentId !== null) {
      const rootButton = actions.createEl("button", { text: "To root" });
      rootButton.addEventListener("click", () => {
        fireAndForget(this.moveNodeToRoot(popupNodeId), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to move node.");
        });
      });
    }
    const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
    if (node.children.length > 0 && !this.collapsed.has(collapseKey)) {
      const childrenEl = nodeEl.createDiv({ cls: "tree-hierarchy-node-children" });
      for (const child of node.children) {
        this.renderNode(childrenEl, child);
      }
    }
    const afterDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
    this.registerInsertDropZone(afterDropZone, node, "after");
  }
  hashNodeKey(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = hash * 31 + value.charCodeAt(index) | 0;
    }
    return hash;
  }
  registerRootDropZone(treeWrapper) {
    treeWrapper.addEventListener("dragover", (event) => {
      if (!this.draggedNodeKey) {
        return;
      }
      event.preventDefault();
      treeWrapper.addClass("is-root-drop-active");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });
    treeWrapper.addEventListener("dragleave", (event) => {
      if (event.currentTarget === event.target) {
        treeWrapper.removeClass("is-root-drop-active");
      }
    });
    treeWrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      treeWrapper.removeClass("is-root-drop-active");
      fireAndForget(this.handleDrop(null), (error) => {
        console.error(error);
        new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
      });
    });
  }
  registerInsertDropZone(dropZone, targetNode, position) {
    dropZone.addEventListener("dragover", (event) => {
      if (!this.draggedNodeKey) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dropZone.addClass("is-drop-active");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.removeClass("is-drop-active");
    });
    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.removeClass("is-drop-active");
      fireAndForget(this.handleSiblingDrop(targetNode, position), (error) => {
        console.error(error);
        new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to reorder node.");
      });
    });
  }
  canDrop(targetNode) {
    return Boolean(this.draggedNodeKey && (targetNode.dbId !== null || targetNode.type === "note" && targetNode.notePath));
  }
  async handleDrop(parentId) {
    const draggedNode = this.draggedNodeKey ? this.plugin.findDisplayNodeByKey(this.draggedNodeKey) : null;
    this.draggedNodeKey = null;
    this.clearDropIndicators();
    if (!draggedNode) {
      return;
    }
    try {
      await this.plugin.moveDisplayNode(draggedNode, parentId);
      this.render();
    } catch (error) {
      console.error(error);
      new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
    }
  }
  async handleSiblingDrop(targetNode, position) {
    const draggedNode = this.draggedNodeKey ? this.plugin.findDisplayNodeByKey(this.draggedNodeKey) : null;
    this.draggedNodeKey = null;
    this.clearDropIndicators();
    if (!draggedNode) {
      return;
    }
    try {
      const location = this.plugin.findNodeLocation(targetNode.key);
      if (!location) {
        return;
      }
      const targetIndex = position === "before" ? location.index : location.index + 1;
      await this.plugin.moveDisplayNodeToIndex(draggedNode, location.parentId, targetIndex);
      this.render();
    } catch (error) {
      console.error(error);
      new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to reorder node.");
    }
  }
  clearDropIndicators() {
    this.contentEl.querySelectorAll(".is-drop-active").forEach((element) => {
      element.removeClass("is-drop-active");
    });
    this.contentEl.querySelectorAll(".is-root-drop-active").forEach((element) => {
      element.removeClass("is-root-drop-active");
    });
  }
  async toggleCollapsed(node) {
    const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
    if (this.collapsed.has(collapseKey)) {
      this.collapsed.delete(collapseKey);
    } else {
      this.collapsed.add(collapseKey);
    }
    await this.render();
  }
  async openNodeFile(node) {
    if (node.type !== "note" || !node.notePath) {
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(node.notePath);
    if (file instanceof import_obsidian.TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
      return;
    }
    new import_obsidian.Notice(`Note file not found: ${node.notePath}`);
  }
  async dropOnNode(node) {
    const parentId = await this.plugin.resolveParentIdForNode(node);
    await this.handleDrop(parentId);
  }
  async moveNodeToRoot(nodeId) {
    await this.plugin.store.moveNode(nodeId, null);
    await this.plugin.refreshTreeView();
  }
  openNodeContextMenu(event, node) {
    const menu = import_obsidian.Menu.forEvent(event);
    menu.addItem((item) => {
      item.setTitle("Create parent group").onClick(() => {
        new CreateParentHierarchyItemModal(this.app, this.plugin, "group", node).open();
      });
    });
    menu.addItem((item) => {
      item.setTitle("Create parent note").onClick(() => {
        new CreateParentHierarchyItemModal(this.app, this.plugin, "note", node).open();
      });
    });
    menu.showAtMouseEvent(event);
  }
};
var TreeHierarchyView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.collapsed = /* @__PURE__ */ new Set();
    this.draggedNodeKey = null;
    this.treeScrollTop = 0;
  }
  getViewType() {
    return VIEW_TYPE_TREE_HIERARCHY;
  }
  getDisplayText() {
    return "Hierarchy view";
  }
  getIcon() {
    return "workflow";
  }
  async onOpen() {
    await this.openView();
  }
  render() {
    const container = this.contentEl;
    const previousTree = container.querySelector(".tree-hierarchy-tree");
    if (previousTree instanceof HTMLElement) {
      this.treeScrollTop = previousTree.scrollTop;
    }
    container.empty();
    container.addClass("tree-hierarchy-view");
    const toolbar = container.createDiv({ cls: "tree-hierarchy-toolbar" });
    const addRootGroupButton = toolbar.createEl("button", { text: "New root group" });
    addRootGroupButton.addEventListener("click", () => {
      new CreateHierarchyItemModal(this.app, this.plugin, "group", null).open();
    });
    const addRootNoteButton = toolbar.createEl("button", { text: "New root note" });
    addRootNoteButton.addEventListener("click", () => {
      new CreateHierarchyItemModal(this.app, this.plugin, "note", null).open();
    });
    const treeWrapper = container.createDiv({ cls: "tree-hierarchy-tree" });
    treeWrapper.scrollTop = this.treeScrollTop;
    this.registerRootDropZone(treeWrapper);
    treeWrapper.createDiv({
      cls: "tree-hierarchy-dropzone",
      text: "Drop here to move to root"
    });
    const tree = this.plugin.getDisplayTree();
    if (tree.length === 0) {
      treeWrapper.createDiv({
        cls: "tree-hierarchy-empty",
        text: "No hierarchy yet. Create a group, create a note, or assign an existing vault note."
      });
      return;
    }
    for (const node of tree) {
      this.renderNode(treeWrapper, node);
    }
    window.requestAnimationFrame(() => {
      treeWrapper.scrollTop = this.treeScrollTop;
    });
  }
  renderNode(parentEl, node) {
    const nodeEl = parentEl.createDiv({ cls: "tree-hierarchy-node" });
    const beforeDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
    this.registerInsertDropZone(beforeDropZone, node, "before");
    const header = nodeEl.createDiv({ cls: "tree-hierarchy-node-header" });
    header.draggable = true;
    header.addEventListener("dragstart", (event) => {
      this.draggedNodeKey = node.key;
      header.addClass("is-dragging");
      event.dataTransfer?.setData("text/plain", node.key);
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
      }
    });
    header.addEventListener("dragend", () => {
      this.draggedNodeKey = null;
      header.removeClass("is-dragging");
      this.clearDropIndicators();
    });
    if (node.children.length > 0) {
      const toggle = header.createEl("button", {
        cls: "tree-hierarchy-node-toggle",
        text: this.collapsed.has(node.dbId ?? this.hashNodeKey(node.key)) ? "+" : "-"
      });
      toggle.addEventListener("click", () => {
        this.toggleCollapsed(node);
      });
    } else {
      header.createSpan({ cls: "tree-hierarchy-node-toggle", text: "" });
    }
    const label = header.createEl("button", {
      cls: `tree-hierarchy-node-label ${node.type === "note" ? "is-note" : ""}`,
      text: node.title
    });
    label.addEventListener("click", () => {
      fireAndForget(this.openNodeFile(node));
    });
    header.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.openNodeContextMenu(event, node);
    });
    const actions = header.createDiv({ cls: "tree-hierarchy-node-actions" });
    if (node.dbId !== null || node.type === "note" && node.notePath) {
      header.addClass("is-drop-target");
      header.addEventListener("dragover", (event) => {
        if (!this.canDrop(node)) {
          return;
        }
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "move";
        }
        header.addClass("is-drop-active");
      });
      header.addEventListener("dragleave", () => {
        header.removeClass("is-drop-active");
      });
      header.addEventListener("drop", (event) => {
        header.removeClass("is-drop-active");
        if (!this.canDrop(node)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        fireAndForget(this.dropOnNode(node), (error) => {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
        });
      });
      const addGroup = actions.createEl("button", { text: "+G" });
      addGroup.addEventListener("click", () => {
        fireAndForget(this.plugin.openCreateModalForNode("group", node), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open create group dialog.");
        });
      });
      const addNote = actions.createEl("button", { text: "+N" });
      addNote.addEventListener("click", () => {
        fireAndForget(this.plugin.openCreateModalForNode("note", node), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open create note dialog.");
        });
      });
      const addExisting = actions.createEl("button", { text: "+E" });
      addExisting.addEventListener("click", () => {
        fireAndForget(this.plugin.openAssignExistingModalForNode(node), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open add existing note dialog.");
        });
      });
      if (node.dbId !== null) {
        const moveNode = actions.createEl("button", { text: "Move" });
        moveNode.addEventListener("click", () => {
          new MoveHierarchyNodeModal(this.app, this.plugin, node).open();
        });
      }
    }
    const viewNodeId = node.dbId;
    if (node.type === "note" && node.notePath) {
      if (viewNodeId !== null && node.parentId !== null) {
        const rootButton = actions.createEl("button", { text: "To root" });
        rootButton.addEventListener("click", () => {
          fireAndForget(this.moveNodeToRoot(viewNodeId), (error) => {
            console.error(error);
            new import_obsidian.Notice("Failed to move node.");
          });
        });
      }
    }
    const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
    if (node.children.length > 0 && !this.collapsed.has(collapseKey)) {
      const childrenEl = nodeEl.createDiv({ cls: "tree-hierarchy-node-children" });
      for (const child of node.children) {
        this.renderNode(childrenEl, child);
      }
    }
    const afterDropZone = nodeEl.createDiv({ cls: "tree-hierarchy-insert-zone" });
    this.registerInsertDropZone(afterDropZone, node, "after");
  }
  hashNodeKey(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = hash * 31 + value.charCodeAt(index) | 0;
    }
    return hash;
  }
  registerRootDropZone(treeWrapper) {
    treeWrapper.addEventListener("dragover", (event) => {
      if (!this.draggedNodeKey) {
        return;
      }
      event.preventDefault();
      treeWrapper.addClass("is-root-drop-active");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });
    treeWrapper.addEventListener("dragleave", (event) => {
      if (event.currentTarget === event.target) {
        treeWrapper.removeClass("is-root-drop-active");
      }
    });
    treeWrapper.addEventListener("drop", (event) => {
      event.preventDefault();
      treeWrapper.removeClass("is-root-drop-active");
      fireAndForget(this.handleDrop(null), (error) => {
        console.error(error);
        new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
      });
    });
  }
  registerInsertDropZone(dropZone, targetNode, position) {
    dropZone.addEventListener("dragover", (event) => {
      if (!this.draggedNodeKey) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      dropZone.addClass("is-drop-active");
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.removeClass("is-drop-active");
    });
    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      dropZone.removeClass("is-drop-active");
      fireAndForget(this.handleSiblingDrop(targetNode, position), (error) => {
        console.error(error);
        new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to reorder node.");
      });
    });
  }
  canDrop(targetNode) {
    return Boolean(this.draggedNodeKey && (targetNode.dbId !== null || targetNode.type === "note" && targetNode.notePath));
  }
  async handleDrop(parentId) {
    const draggedNode = this.draggedNodeKey ? this.plugin.findDisplayNodeByKey(this.draggedNodeKey) : null;
    this.draggedNodeKey = null;
    this.clearDropIndicators();
    if (!draggedNode) {
      return;
    }
    try {
      await this.plugin.moveDisplayNode(draggedNode, parentId);
      this.render();
    } catch (error) {
      console.error(error);
      new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to move node.");
    }
  }
  async handleSiblingDrop(targetNode, position) {
    const draggedNode = this.draggedNodeKey ? this.plugin.findDisplayNodeByKey(this.draggedNodeKey) : null;
    this.draggedNodeKey = null;
    this.clearDropIndicators();
    if (!draggedNode) {
      return;
    }
    try {
      const location = this.plugin.findNodeLocation(targetNode.key);
      if (!location) {
        return;
      }
      const targetIndex = position === "before" ? location.index : location.index + 1;
      await this.plugin.moveDisplayNodeToIndex(draggedNode, location.parentId, targetIndex);
      this.render();
    } catch (error) {
      console.error(error);
      new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to reorder node.");
    }
  }
  clearDropIndicators() {
    this.contentEl.querySelectorAll(".is-drop-active").forEach((element) => {
      element.removeClass("is-drop-active");
    });
    this.contentEl.querySelectorAll(".is-root-drop-active").forEach((element) => {
      element.removeClass("is-root-drop-active");
    });
  }
  async openView() {
    await this.plugin.whenReady();
    await this.plugin.store.syncVaultNotes();
    this.render();
  }
  toggleCollapsed(node) {
    const collapseKey = node.dbId ?? this.hashNodeKey(node.key);
    if (this.collapsed.has(collapseKey)) {
      this.collapsed.delete(collapseKey);
    } else {
      this.collapsed.add(collapseKey);
    }
    this.render();
  }
  async openNodeFile(node) {
    if (node.type !== "note" || !node.notePath) {
      return;
    }
    const file = this.app.vault.getAbstractFileByPath(node.notePath);
    if (file instanceof import_obsidian.TFile) {
      await this.app.workspace.getLeaf(true).openFile(file);
      return;
    }
    new import_obsidian.Notice(`Note file not found: ${node.notePath}`);
  }
  async dropOnNode(node) {
    const parentId = await this.plugin.resolveParentIdForNode(node);
    await this.handleDrop(parentId);
  }
  async moveNodeToRoot(nodeId) {
    await this.plugin.store.moveNode(nodeId, null);
    await this.plugin.refreshTreeView();
  }
  openNodeContextMenu(event, node) {
    const menu = import_obsidian.Menu.forEvent(event);
    menu.addItem((item) => {
      item.setTitle("Create parent group").onClick(() => {
        new CreateParentHierarchyItemModal(this.app, this.plugin, "group", node).open();
      });
    });
    menu.addItem((item) => {
      item.setTitle("Create parent note").onClick(() => {
        new CreateParentHierarchyItemModal(this.app, this.plugin, "note", node).open();
      });
    });
    menu.showAtMouseEvent(event);
  }
};
var TreeHierarchySettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Database file name").setDesc("SQLite file name stored in the plugin folder inside the vault config directory.").addText(
      (text) => text.setPlaceholder(DEFAULT_DB_FILENAME).setValue(this.plugin.settings.dbFileName).onChange((value) => {
        fireAndForget(this.plugin.updateDatabaseFileName(value), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to update database file name.");
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Backup database").setDesc(this.plugin.settings.backupDbPath || "No backup location selected.").addButton(
      (button) => button.setButtonText("Set location").onClick(() => {
        fireAndForget(this.handleBackupBrowse(button.buttonEl));
      })
    ).addButton(
      (button) => button.setButtonText("Back up").onClick(() => {
        fireAndForget(this.plugin.backupNow(), (error) => {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to create backup.");
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Restore database").setDesc("Pick the backup file to restore from.").addButton(
      (button) => button.setButtonText("Restore").onClick(() => {
        fireAndForget(this.handleRestoreBrowse(button.buttonEl), (error) => {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to restore backup.");
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Notes root folder").setDesc("Vault folder used for notes created from the hierarchy.").addText(
      (text) => text.setPlaceholder("Vault root").setValue(this.plugin.settings.noteRootFolder).onChange((value) => {
        fireAndForget(this.plugin.updateNoteRootFolder(value), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to save note root folder.");
        });
      })
    );
    new import_obsidian.Setting(containerEl).setName("Documentation").setDesc("Open the plugin README for a full feature overview.").addButton(
      (button) => button.setButtonText("View readme").onClick(() => {
        window.open("https://github.com/dhiraj-ydv/hierarchy-view/blob/master/README.md", "_blank");
      })
    );
  }
  async handleBackupBrowse(buttonEl) {
    buttonEl.blur();
    const pickedPath = await this.plugin.pickBackupPath();
    if (!pickedPath) {
      return;
    }
    await this.plugin.updateBackupDbPath(pickedPath);
    this.display();
  }
  async handleRestoreBrowse(buttonEl) {
    buttonEl.blur();
    await this.plugin.restoreFromBackupNow();
  }
};
var SQLiteTreeHierarchyPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.store = new TreeHierarchyStore(this);
    this.popupModal = null;
    this.startupPromise = null;
  }
  onload() {
    this.registerView(
      VIEW_TYPE_TREE_HIERARCHY,
      (leaf) => new TreeHierarchyView(leaf, this)
    );
    this.addRibbonIcon("workflow", "Open hierarchy view", () => {
      this.openPopup();
    });
    this.app.workspace.onLayoutReady(() => {
      fireAndForget(this.ensureSidebarTab(), (error) => {
        console.error(error);
      });
    });
    this.addCommand({
      id: "open-tree-hierarchy",
      name: "Open sidebar",
      callback: () => {
        fireAndForget(this.activateView(), (error) => {
          console.error(error);
          new import_obsidian.Notice("Failed to open hierarchy view.");
        });
      }
    });
    this.addCommand({
      id: "create-root-hierarchy-note",
      name: "Create root note",
      callback: () => {
        new CreateHierarchyItemModal(this.app, this, "note", null).open();
      }
    });
    this.addCommand({
      id: "backup-database-now",
      name: "Back up database now",
      callback: () => {
        fireAndForget(this.backupNow(), (error) => {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to create backup.");
        });
      }
    });
    this.addCommand({
      id: "restore-database-from-backup",
      name: "Restore database from backup",
      callback: () => {
        fireAndForget(this.restoreFromBackupNow(), (error) => {
          console.error(error);
          new import_obsidian.Notice(error instanceof Error ? error.message : "Failed to restore backup.");
        });
      }
    });
    this.addSettingTab(new TreeHierarchySettingTab(this.app, this));
    this.startupPromise = this.initializePlugin();
    fireAndForget(this.startupPromise, (error) => {
      console.error("Failed to initialize hierarchy view", error);
      new import_obsidian.Notice("Hierarchy view failed to initialize. Check the developer console.");
    });
  }
  onunload() {
    this.popupModal?.close();
    this.popupModal = null;
  }
  async loadSettings() {
    const savedSettings = await this.loadData();
    const recoveryState = await this.readRecoveryState();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings ?? {});
    if (!this.settings.backupDbPath && recoveryState.backupDbPath) {
      this.settings.backupDbPath = recoveryState.backupDbPath;
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
    await this.writeRecoveryState({
      backupDbPath: this.settings.backupDbPath
    });
  }
  async reloadStore() {
    this.store = new TreeHierarchyStore(this);
    await this.store.initialize();
    await this.store.syncVaultNotes();
    await this.refreshTreeView();
  }
  async activateView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)[0];
    if (existing) {
      await existing.setViewState({ type: VIEW_TYPE_TREE_HIERARCHY, active: true });
      this.app.workspace.revealLeaf(existing);
      return;
    }
    let leaf = this.app.workspace.getLeftLeaf(false);
    if (!leaf) {
      leaf = this.app.workspace.getLeftLeaf(true);
    }
    if (!leaf) {
      return;
    }
    await leaf.setViewState({ type: VIEW_TYPE_TREE_HIERARCHY, active: true });
    this.app.workspace.revealLeaf(leaf);
  }
  async ensureSidebarTab() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)[0];
    if (existing) {
      return;
    }
    let leaf = this.app.workspace.getLeftLeaf(false);
    if (!leaf) {
      leaf = this.app.workspace.getLeftLeaf(true);
    }
    if (!leaf) {
      return;
    }
    await leaf.setViewState({ type: VIEW_TYPE_TREE_HIERARCHY, active: false, pinned: true });
  }
  async refreshTreeView(skipReady = false) {
    if (!skipReady) {
      await this.whenReady();
    }
    await this.store.syncVaultNotes();
    if (this.popupModal) {
      await this.popupModal.render();
    }
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_TREE_HIERARCHY)) {
      const view = leaf.view;
      if (view instanceof TreeHierarchyView) {
        view.render();
      }
    }
  }
  async createNoteInHierarchy(title, parentId, folder) {
    const normalizedFolder = folder.replace(/^\/+|\/+$/g, "");
    if (normalizedFolder) {
      await this.ensureFolderExists(normalizedFolder);
    }
    const safeTitle = title.replace(/[\\/:*?"<>|#^\]]/g, "").trim() || "Untitled";
    const notePath = normalizedFolder ? `${normalizedFolder}/${safeTitle}.md` : `${safeTitle}.md`;
    const uniquePath = this.getAvailableNotePath(notePath);
    const file = await this.app.vault.create(uniquePath, `# ${title}
`);
    const createdId = await this.store.createNoteNode(title, parentId, file.path);
    await this.app.workspace.getLeaf(true).openFile(file);
    return createdId;
  }
  async createParentForNode(targetNode, type, title, folder) {
    const location = this.findNodeLocation(targetNode.key);
    if (!location) {
      throw new Error("Could not determine the target node location.");
    }
    const targetNodeId = await this.resolveNodeIdForDisplayNode(targetNode);
    if (targetNodeId === null) {
      throw new Error("Could not resolve the target node.");
    }
    const newParentId = type === "group" ? await this.store.createGroup(title, location.parentId) : await this.createNoteInHierarchy(title, location.parentId, folder);
    const refreshedLocation = this.findNodeLocation(targetNode.key);
    if (!refreshedLocation) {
      throw new Error("Could not refresh the target node location.");
    }
    await this.store.moveNodeToIndex(newParentId, refreshedLocation.parentId, refreshedLocation.index);
    await this.store.moveNodeToIndex(targetNodeId, newParentId, 0);
  }
  async ensureFolderExists(path2) {
    const parts = path2.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }
  getAvailableNotePath(notePath) {
    if (!this.app.vault.getAbstractFileByPath(notePath)) {
      return notePath;
    }
    const extension = ".md";
    const basePath = notePath.endsWith(extension) ? notePath.slice(0, -extension.length) : notePath;
    let suffix = 1;
    let candidate = `${basePath} ${suffix}${extension}`;
    while (this.app.vault.getAbstractFileByPath(candidate)) {
      suffix += 1;
      candidate = `${basePath} ${suffix}${extension}`;
    }
    return candidate;
  }
  getDisplayTree() {
    const storedTree = this.store.getTree();
    return this.mapStoredNodes(storedTree);
  }
  findDisplayNodeByKey(targetKey) {
    const walk = (nodes) => {
      for (const node of nodes) {
        if (node.key === targetKey) {
          return node;
        }
        const match = walk(node.children);
        if (match) {
          return match;
        }
      }
      return null;
    };
    return walk(this.getDisplayTree());
  }
  findNodeLocation(targetKey) {
    const walk = (nodes, parentId) => {
      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index];
        if (node.key === targetKey) {
          return { parentId, index };
        }
        const childResult = walk(node.children, node.dbId);
        if (childResult) {
          return childResult;
        }
      }
      return null;
    };
    return walk(this.getDisplayTree(), null);
  }
  getDisplaySiblings(parentId) {
    if (parentId === null) {
      return this.getDisplayTree();
    }
    const parentNode = this.findDisplayNodeByKey(`db:${parentId}`);
    return parentNode?.children ?? [];
  }
  getRootAttachableNotes() {
    const rootNotes = this.getDisplayTree().filter((node) => node.type === "note" && node.parentId === null && node.notePath);
    return rootNotes.map((node) => this.app.vault.getAbstractFileByPath(node.notePath)).filter((file) => file instanceof import_obsidian.TFile);
  }
  async moveDisplayNode(node, parentId) {
    await this.moveDisplayNodeToIndex(node, parentId, null);
  }
  async moveDisplayNodeToIndex(node, parentId, index) {
    const nodeId = node.dbId ?? (node.notePath ? await this.resolveParentIdForNode(node) : null);
    if (nodeId === null) {
      return;
    }
    await this.store.moveNodeToIndex(nodeId, parentId, index);
  }
  async resolveParentIdForNode(node) {
    if (node.dbId !== null) {
      return node.dbId;
    }
    if (node.type === "note" && node.notePath) {
      const file = this.app.vault.getAbstractFileByPath(node.notePath);
      if (!(file instanceof import_obsidian.TFile)) {
        throw new Error("Note file no longer exists.");
      }
      return this.store.ensureTrackedNote(file.basename, file.path);
    }
    return null;
  }
  async resolveNodeIdForDisplayNode(node) {
    if (node.dbId !== null) {
      return node.dbId;
    }
    if (node.type === "note" && node.notePath) {
      const file = this.app.vault.getAbstractFileByPath(node.notePath);
      if (!(file instanceof import_obsidian.TFile)) {
        throw new Error("Note file no longer exists.");
      }
      return this.store.ensureTrackedNote(file.path, file.path);
    }
    return null;
  }
  async openCreateModalForNode(type, node) {
    const parentId = await this.resolveParentIdForNode(node);
    new CreateHierarchyItemModal(this.app, this, type, parentId).open();
    await this.refreshTreeView();
  }
  async openAssignExistingModalForNode(node) {
    const parentId = await this.resolveParentIdForNode(node);
    new AssignExistingNoteModal(this.app, this, parentId).open();
    await this.refreshTreeView();
  }
  openPopup() {
    if (this.popupModal) {
      this.popupModal.close();
    }
    this.popupModal = new TreeHierarchyPopupModal(this.app, this);
    this.popupModal.open();
  }
  async whenReady() {
    if (this.startupPromise) {
      await this.startupPromise;
    }
  }
  onPopupClosed(modal) {
    if (this.popupModal === modal) {
      this.popupModal = null;
    }
  }
  mapStoredNodes(nodes) {
    return nodes.map((node) => ({
      key: `db:${node.id}`,
      dbId: node.id,
      parentId: node.parentId,
      type: node.type,
      title: node.title,
      notePath: node.notePath,
      children: this.mapStoredNodes(node.children),
      isAssigned: true
    }));
  }
  getDatabaseDirectory() {
    return this.getPluginDirectory();
  }
  getDatabasePath() {
    return (0, import_obsidian.normalizePath)(`${this.getDatabaseDirectory()}/${this.settings.dbFileName}`);
  }
  getPluginDirectory() {
    return (0, import_obsidian.normalizePath)(`${this.app.vault.configDir}/plugins/${this.manifest.id}`);
  }
  async initializePlugin() {
    await this.loadSettings();
    await this.store.initialize();
    await this.store.syncVaultNotes();
    await this.refreshTreeView(true);
  }
  async updateDatabaseFileName(value) {
    this.settings.dbFileName = value.trim() || DEFAULT_DB_FILENAME;
    await this.saveSettings();
    await this.reloadStore();
  }
  async updateBackupDbPath(value) {
    this.settings.backupDbPath = value.trim();
    await this.saveSettings();
  }
  async pickBackupPath() {
    const pickedPath = await this.showSystemPathPicker({
      type: "directory",
      title: "Choose backup directory"
    });
    return pickedPath;
  }
  async pickRestoreFilePath() {
    const pickedPath = await this.showSystemPathPicker({
      type: "file",
      title: "Choose backup file to restore"
    });
    return pickedPath;
  }
  async updateNoteRootFolder(value) {
    this.settings.noteRootFolder = value.trim();
    await this.saveSettings();
  }
  async backupNow() {
    await this.whenReady();
    await this.store.syncVaultNotes();
    if (!this.settings.backupDbPath.trim()) {
      throw new Error("Set a backup database path first.");
    }
    await this.writeBackupDatabase(this.store.exportDatabaseBytes());
    new import_obsidian.Notice("Hierarchy view database backup updated.");
  }
  async restoreFromBackupNow() {
    const pickedPath = await this.pickRestoreFilePath();
    if (!pickedPath) {
      throw new Error("Restore cancelled.");
    }
    const backupBytes = await this.readBackupFile(pickedPath);
    if (!backupBytes) {
      throw new Error("Backup database was not found.");
    }
    const adapter = this.app.vault.adapter;
    const primaryDir = this.getDatabaseDirectory();
    if (!await adapter.exists(primaryDir)) {
      await adapter.mkdir(primaryDir);
    }
    await adapter.writeBinary(this.getDatabasePath(), toArrayBuffer(backupBytes));
    await this.reloadStore();
    new import_obsidian.Notice("Hierarchy view database restored from backup.");
  }
  async writeBackupDatabase(data) {
    const backupPath = this.settings.backupDbPath.trim();
    if (!backupPath) {
      return;
    }
    const target = await this.resolveBackupTarget(backupPath);
    if (target.type === "directory") {
      await import_promises.default.mkdir(target.path, { recursive: true });
      const backupFilePath = import_path.default.join(target.path, this.createBackupFileName());
      await import_promises.default.writeFile(backupFilePath, data);
      return;
    }
    await import_promises.default.mkdir(import_path.default.dirname(target.path), { recursive: true });
    await import_promises.default.writeFile(target.path, data);
  }
  async readBackupDatabase() {
    const backupPath = this.settings.backupDbPath.trim();
    if (!backupPath) {
      return null;
    }
    const target = await this.resolveBackupTarget(backupPath);
    const resolvedPath = target.type === "directory" ? await this.findLatestBackupFile(target.path) : target.path;
    if (!resolvedPath) {
      return null;
    }
    try {
      const data = await import_promises.default.readFile(resolvedPath);
      return new Uint8Array(data);
    } catch {
      return null;
    }
  }
  async readBackupFile(targetPath) {
    try {
      const data = await import_promises.default.readFile(targetPath);
      return new Uint8Array(data);
    } catch {
      return null;
    }
  }
  async resolveBackupTarget(configuredPath) {
    const resolvedPath = this.resolveConfiguredBackupPath(configuredPath);
    const pathInfo = await this.getPathInfo(resolvedPath);
    if (pathInfo?.isDirectory) {
      return { type: "directory", path: resolvedPath };
    }
    if (pathInfo?.exists) {
      return { type: "file", path: resolvedPath };
    }
    if (this.looksLikeDirectoryPath(configuredPath)) {
      return { type: "directory", path: resolvedPath };
    }
    return { type: "file", path: resolvedPath };
  }
  resolveConfiguredBackupPath(configuredPath) {
    if (import_path.default.isAbsolute(configuredPath)) {
      return configuredPath;
    }
    const vaultBasePath = this.getVaultBasePath();
    return import_path.default.resolve(vaultBasePath, configuredPath);
  }
  looksLikeDirectoryPath(configuredPath) {
    const trimmed = configuredPath.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed.endsWith("/") || trimmed.endsWith("\\")) {
      return true;
    }
    return import_path.default.extname(trimmed) === "";
  }
  async getPathInfo(targetPath) {
    try {
      const stat = await import_promises.default.stat(targetPath);
      return {
        exists: true,
        isDirectory: stat.isDirectory()
      };
    } catch {
      return null;
    }
  }
  createBackupFileName() {
    const now = /* @__PURE__ */ new Date();
    const datePart = [
      String(now.getDate()).padStart(2, "0"),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getFullYear())
    ].join("");
    const timePart = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0")
    ].join("");
    const vaultName = this.getSanitizedVaultName();
    return `hv_${vaultName}_${datePart}_${timePart}.sqlite`;
  }
  getSanitizedVaultName() {
    const vaultName = this.app.vault.getName().trim() || "vault";
    const safeName = vaultName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return safeName || "vault";
  }
  async findLatestBackupFile(directoryPath) {
    try {
      const entries = await import_promises.default.readdir(directoryPath, { withFileTypes: true });
      const backupFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".sqlite")).map((entry) => import_path.default.join(directoryPath, entry.name));
      if (backupFiles.length === 0) {
        return null;
      }
      const filesWithStats = await Promise.all(
        backupFiles.map(async (filePath) => ({
          filePath,
          stat: await import_promises.default.stat(filePath)
        }))
      );
      filesWithStats.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
      return filesWithStats[0].filePath;
    } catch {
      return null;
    }
  }
  getVaultBasePath() {
    const adapter = this.app.vault.adapter;
    if (typeof adapter.getBasePath === "function") {
      return adapter.getBasePath();
    }
    if (typeof adapter.basePath === "string" && adapter.basePath) {
      return adapter.basePath;
    }
    throw new Error("Could not resolve the vault base path for the backup database.");
  }
  async readRecoveryState() {
    try {
      const raw = await import_promises.default.readFile(this.getRecoveryStatePath(), "utf8");
      const parsed = JSON.parse(raw);
      return {
        backupDbPath: typeof parsed.backupDbPath === "string" ? parsed.backupDbPath : ""
      };
    } catch {
      return {
        backupDbPath: ""
      };
    }
  }
  async writeRecoveryState(state) {
    const recoveryPath = this.getRecoveryStatePath();
    await import_promises.default.mkdir(import_path.default.dirname(recoveryPath), { recursive: true });
    await import_promises.default.writeFile(recoveryPath, JSON.stringify(state, null, 2), "utf8");
  }
  getRecoveryStatePath() {
    return import_path.default.join(this.getVaultBasePath(), this.app.vault.configDir, `${this.manifest.id}-recovery.json`);
  }
  async showSystemPathPicker(options) {
    const electronDialogPath = await this.pickPathWithElectron(options);
    if (electronDialogPath) {
      return electronDialogPath;
    }
    return this.pickPathWithHtmlInput(options);
  }
  async pickPathWithElectron(options) {
    try {
      const win = window;
      const electron = win.require?.("electron");
      const dialog = electron?.remote?.dialog ?? electron?.dialog;
      if (!dialog?.showOpenDialog) {
        return null;
      }
      const result = await dialog.showOpenDialog({
        title: options.title,
        properties: options.type === "directory" ? ["openDirectory", "createDirectory"] : ["openFile"],
        filters: options.type === "file" ? [{ name: "Sqlite", extensions: ["sqlite", "db"] }] : void 0
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      return result.filePaths[0];
    } catch {
      return null;
    }
  }
  async pickPathWithHtmlInput(options) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.setCssProps({
        display: "none"
      });
      if (options.type === "directory") {
        input.setAttribute("webkitdirectory", "");
      } else {
        input.accept = ".sqlite,.db";
      }
      const cleanup = () => {
        input.remove();
      };
      input.addEventListener(
        "change",
        () => {
          const files = input.files;
          if (!files || files.length === 0) {
            cleanup();
            resolve(null);
            return;
          }
          const file = files[0];
          if (options.type === "directory") {
            const filePath = file.path;
            const relativePath = file.webkitRelativePath;
            if (filePath && relativePath) {
              const normalizedRelativePath = relativePath.replace(/\//g, import_path.default.sep);
              const directoryPath = filePath.slice(0, filePath.length - normalizedRelativePath.length);
              cleanup();
              resolve(directoryPath.replace(/[\\/]+$/, ""));
              return;
            }
          }
          cleanup();
          resolve(file.path ?? null);
        },
        { once: true }
      );
      document.body.appendChild(input);
      input.click();
    });
  }
};
