// Lexora Super Admin Console Controller

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    lucide.createIcons();

    // 2. Load and Inject SVG Logo Icon
    fetch('../assets/logo_icon_light.svg')
        .then(res => res.text())
        .then(svgText => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgContent = doc.documentElement.innerHTML;
            const viewBox = doc.documentElement.getAttribute('viewBox') || '0 0 200 200';
            
            const logoEl = document.getElementById('admin-logo-icon');
            if (logoEl) {
                logoEl.innerHTML = svgContent;
                logoEl.setAttribute('viewBox', viewBox);
            }
        })
        .catch(err => console.error('Error loading admin logo icon:', err));

    // 3. Fetch System Metrics
    function loadSystemMetrics() {
        fetch('/api/admin/stats')
            .then(res => res.json())
            .then(data => {
                document.getElementById('metric-tenants').textContent = data.tenants;
                document.getElementById('metric-users').textContent = data.users;
                document.getElementById('metric-cases').textContent = data.cases;
                document.getElementById('metric-revenue').textContent = `$${parseFloat(data.revenue).toLocaleString()}`;
            })
            .catch(err => {
                console.error("Error loading system metrics:", err);
                showToast("System metrics fetch failed");
            });
    }

    // 4. Fetch and Render Tenant workspaces
    function loadTenantRegistry() {
        const tbody = document.getElementById('tenants-table-body');
        if (!tbody) return;

        fetch('/api/admin/tenants')
            .then(res => res.json())
            .then(tenants => {
                tbody.innerHTML = '';
                if (tenants.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--slate-500)">No active tenants registered in Neon SQL database.</td></tr>`;
                    return;
                }

                tenants.forEach(t => {
                    const dateStr = new Date(t.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>#${t.id}</strong></td>
                        <td>${t.name}</td>
                        <td>${dateStr}</td>
                        <td style="text-align: center;"><span class="badge-operator">${t.user_count}</span></td>
                        <td style="text-align: center;">${t.client_count}</td>
                        <td style="text-align: center;">${t.case_count}</td>
                        <td style="text-align: right;">
                            <button class="btn-danger" onclick="deleteTenantWorkspace(${t.id}, '${t.name.replace(/'/g, "\\'")}')">Deprovision</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(err => {
                console.error("Error loading tenants registry:", err);
                showToast("Tenant database registry fetch failed");
            });
    }

    // Deprovision workspace
    window.deleteTenantWorkspace = function(tenantId, firmName) {
        if (!confirm(`CAUTION: Are you sure you want to completely deprovision "${firmName}"?\nThis will permanently delete all associated lawyers, clients, cases, and invoices.`)) {
            return;
        }

        fetch(`/api/admin/tenants/${tenantId}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            showToast(`Deprovisioned workspace: ${firmName}`);
            loadSystemMetrics();
            loadTenantRegistry();
        })
        .catch(err => {
            console.error("Error deleting tenant workspace:", err);
            showToast("Workspace deprovisioning failed");
        });
    }

    // Toast alert message utility
    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Run Startup loads
    loadSystemMetrics();
    loadTenantRegistry();
});
