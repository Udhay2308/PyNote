import { useState, useRef, useEffect } from "react";

function Sidebar({ notebooks, activeId, onSelect, onAdd, onDelete, onImport, onLogout, user, isDark, toggleDark }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const bg = isDark ? "#0D1320" : "#f5f5f5";
  const text = isDark ? "#F5F7FA" : "#222";
  const border = isDark ? "#2A3447" : "#ddd";
  const activeBg = isDark ? "#4F8CFF20" : "#e8f0fe";
  const activeBorder = "#8B1A1A";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onImport(event.target.result, file.name);
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
{/* Logout Modal */}
{showLogoutModal && (
  <div
    onClick={() => setShowLogoutModal(false)}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >

    {/* Gradient Border Wrapper */}
    <div
      className="logout-card-wrapper"
      onClick={(e) => e.stopPropagation()}
    >

      {/* Actual Card */}
      <div
        style={{
          background: "#1A2233",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "380px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >

        {/* User Profile */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "20px",
            gap: "10px",
          }}
        >

          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #B8860B",
              }}
            />
          ) : (
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#8B1A1A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "700",
                fontSize: "22px",
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}


          <div>
            <div
              style={{
                color: "#F5F7FA",
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "2px",
              }}
            >
              {user?.name}
            </div>

            <div
              style={{
                color: "#9AA4B2",
                fontSize: "13px",
              }}
            >
              {user?.email}
            </div>
          </div>

        </div>


        <h3
          style={{
            color: "#F5F7FA",
            margin: "0 0 8px",
            fontSize: "20px",
            fontWeight: "700",
          }}
        >
          Sign out?
        </h3>


        <p
          style={{
            color: "#9AA4B2",
            margin: "0 0 28px",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          You'll need to sign in again to access your notebooks.
        </p>



        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >

          {/* Cancel Button */}
          <button
            onClick={() => setShowLogoutModal(false)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #384458",
              background: "transparent",
              color: "#DCE3EE",
              fontSize: "15px",
              cursor: "pointer",
              transition: ".2s",
            }}

            onMouseEnter={(e)=>
              e.currentTarget.style.background="#222B3A"
            }

            onMouseLeave={(e)=>
              e.currentTarget.style.background="transparent"
            }
          >
            Cancel
          </button>



          {/* Logout Button */}
          <button
            onClick={() => {
              setShowLogoutModal(false);
              onLogout();
            }}

            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "#8B1A1A",
              color:"#fff",
              fontSize:"15px",
              fontWeight:"600",
              cursor:"pointer",
              boxShadow:"0 4px 12px rgba(139,26,26,0.3)",
              transition:".2s",
            }}

            onMouseEnter={(e)=>
              e.currentTarget.style.background="#A52020"
            }

            onMouseLeave={(e)=>
              e.currentTarget.style.background="#8B1A1A"
            }
          >
            Sign Out
          </button>


        </div>


      </div>

    </div>

  </div>
)}

      {/* Sidebar toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Show sidebar" : "Hide sidebar"}
        style={{
          position: "fixed",
          top: "50%",
          left: collapsed ? "0px" : "250px",
          transform: "translateY(-50%)",
          zIndex: 100,
          width: "20px", height: "48px",
          background: isDark ? "#8B1A1A" : "#D1D5DB",
          border: `1px solid ${border}`,
          borderLeft: collapsed ? `1px solid ${border}` : "none",
          borderRadius: "0 6px 6px 0",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isDark ? "#9AA4B2" : "#555",
          fontSize: "12px",
          transition: "left 0.3s ease",
          padding: 0,
        }}
      >
        {collapsed ? "›" : "‹"}
      </button>

      {/* Sidebar */}
      <div style={{
        width: collapsed ? "0px" : "250px",
        height: "100%",
        borderRight: collapsed ? "none" : `1px solid ${border}`,
        background: bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none",
        transition: "width 0.3s ease",
        flexShrink: 0,
      }}>
        {!collapsed && (
          <>
            {/* TOP */}
            <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>

              {/* User info */}
              {user && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "20px", padding: "10px",
                  background: isDark ? "#8B1A1A" : "#D1D5DB",
                  borderRadius: "10px",
                  border: `1px solid ${activeBorder}`,
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%",
                      background: "#4F8CFF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: "bold", fontSize: "14px", flexShrink: 0,
                    }}>
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{
                      color: text, fontSize: "13px", fontWeight: "600",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      color: "#9AA4B2", fontSize: "11px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {user.email}
                    </div>
                  </div>
                </div>
              )}

              {/* Header with theme toggle */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ color: text, flex: 1, margin: 0, fontSize: "15px", fontWeight: "600" }}>
                  Notebooks
                </h3>

                {/* Professional theme toggle */}
                <button
                  onClick={toggleDark}
                  title="Toggle theme"
                  style={{
                    width: "44px", height: "24px",
                    borderRadius: "12px",
                    background: isDark ? "#8B1A1A" : "#D1D5DB",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.3s ease",
                    flexShrink: 0,
                  }}
                >
                  {/* Toggle knob */}
                  <div style={{
                    position: "absolute",
                    top: "2px",
                    left: isDark ? "22px" : "2px",
                    width: "20px", height: "20px",
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.3s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}>
                    {isDark ? "🌙" : "☀️"}
                  </div>
                </button>
              </div>
            </div>

            {/* MIDDLE — scrollable */}
            <div style={{
              flex: 1, overflowY: "auto", overflowX: "hidden",
              padding: "0 20px",
              scrollbarWidth: "none", msOverflowStyle: "none",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "8px" }}>
                {notebooks.map((nb) => (
                  <div
                    key={nb.notebookId}
                    style={{ position: "relative" }}
                    ref={openMenuId === nb.notebookId ? menuRef : null}
                  >
                    <div style={{
                      display: "flex", alignItems: "center",
                      borderRadius: "8px",
                      border: nb.notebookId === activeId ? `1px solid ${activeBorder}` : "1px solid transparent",
                      background: nb.notebookId === activeId ? activeBg : "transparent",
                      transition: "all 0.15s",
                    }}>
                      {/* Notebook name button */}
                      <button
                        onClick={() => onSelect(nb.notebookId)}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          padding: "9px 8px 9px 10px",
                          background: "transparent",
                          border: "none",
                          fontWeight: nb.notebookId === activeId ? "600" : "400",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: nb.notebookId === activeId ? "#8B1A1A" : text,
                          fontSize: "13px",
                        }}
                      >
                        {nb.title}
                      </button>

                      {/* Three dot menu button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === nb.notebookId ? null : nb.notebookId);
                        }}
                        style={{
                          padding: "6px 8px",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: "#9AA4B2",
                          fontSize: "16px",
                          borderRadius: "6px",
                          flexShrink: 0,
                          opacity: openMenuId === nb.notebookId ? 1 : 0.4,
                          transition: "opacity 0.15s",
                          lineHeight: 1,
                        }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => {
                          if (openMenuId !== nb.notebookId) e.target.style.opacity = 0.4;
                        }}
                      >
                        ···
                      </button>
                    </div>

                    {/* Floating dropdown menu */}
                    {openMenuId === nb.notebookId && (
                      <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        right: 0,
                        zIndex: 200,
                        background: isDark ? "#8B1A1A" : "#D1D5DB",
                        border: `1px solid ${border}`,
                        borderRadius: "10px",
                        padding: "4px",
                        minWidth: "160px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        animation: "fadeIn 0.15s ease",
                      }}>
                        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>

                        {notebooks.length > 1 && (
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              onDelete(nb.notebookId);
                            }}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              background: "transparent",
                              border: "none",
                              borderRadius: "7px",
                              color: "#EF4444",
                              fontSize: "13px",
                              fontWeight: "500",
                              cursor: "pointer",
                              textAlign: "left",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            Delete notebook
                          </button>
                        )}

                        <button
                          onClick={() => setOpenMenuId(null)}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "transparent",
                            border: "none",
                            borderRadius: "7px",
                            color: "#9AA4B2",
                            fontSize: "13px",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isDark ? "#202B3A" : "#f5f5f5"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM — fixed */}
            <div style={{ padding: "12px 20px 20px", flexShrink: 0, borderTop: `1px solid ${border}` }}>
              <button
                onClick={onAdd}
                style={{
                  width: "100%", padding: "9px 12px",
                  borderRadius: "8px",
                  border: `1px solid #8B1A1A`,
                  background: "transparent",
                  cursor: "pointer", color: "#8B1A1A",
                  marginBottom: "8px", fontSize: "13px",
                  fontWeight: "500", transition: ".2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(79,140,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                + New Notebook
              </button>

              <label
                style={{
                  display: "block", width: "100%", boxSizing: "border-box",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: `1px solid #8B1A1A`,
                  background: "transparent",
                  cursor: "pointer", color: "#8B1A1A",
                  textAlign: "center", fontSize: "13px",
                  fontWeight: "500",
                  marginBottom: "12px", transition: ".2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(79,140,255,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                ⬆ Import .ipynb
                <input type="file" accept=".ipynb" onChange={handleFileChange} style={{ display: "none" }} />
              </label>

              <button
                onClick={() => setShowLogoutModal(true)}
                style={{
                  width: "100%", padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #8B1A1A",
                  background: "#8B1A1A",
                  cursor: "pointer", color: "#fff",
                  fontSize: "13px", fontWeight: "500", transition: ".2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#a52121"}
                onMouseLeave={e => e.currentTarget.style.background = "#8B1A1A"}
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Sidebar;