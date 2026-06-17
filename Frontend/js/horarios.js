<script>
        document.addEventListener("DOMContentLoaded", () => {
            const sidebar = document.getElementById("sidebarOverlay");
            const btnAbrir = document.getElementById("btnHamburguesa");
            const btnCerrar = document.getElementById("btnCerrarSidebar");

            if (btnAbrir && sidebar && btnCerrar) {
                btnAbrir.addEventListener("click", () => sidebar.classList.add("open"));
                btnCerrar.addEventListener("click", () => sidebar.classList.remove("open"));
                sidebar.addEventListener("click", (e) => {
                    if (e.target === sidebar) sidebar.classList.remove("open");
                });
            }
        });
    </script>