// =========================================
// ELEMENTS
// =========================================

const projectsLoading =
    document.getElementById(
        "projectsLoading"
    );

const projectsError =
    document.getElementById(
        "projectsError"
    );

const projectsEmpty =
    document.getElementById(
        "projectsEmpty"
    );

const projectsContent =
    document.getElementById(
        "projectsContent"
    );

const projectsTableBody =
    document.getElementById(
        "projectsTableBody"
    );

const totalProjects =
    document.getElementById(
        "totalProjects"
    );

const activeProjects =
    document.getElementById(
        "activeProjects"
    );

const completedProjects =
    document.getElementById(
        "completedProjects"
    );



// =========================================
// MONEY
// =========================================

function formatMoney(pence) {

    const value =
        Number(pence || 0) / 100;


    return new Intl.NumberFormat(
        "en-GB",
        {
            style: "currency",
            currency: "GBP"
        }
    ).format(value);

}



// =========================================
// DATE
// =========================================

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            value.endsWith("Z")
                ? value
                : value + "Z"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}



// =========================================
// STATUS
// =========================================

function formatStatus(status) {

    switch (status) {

        case "awaiting_deposit":
            return "Awaiting Deposit";

        case "ready":
            return "Ready";

        case "in_progress":
            return "In Progress";

        case "review":
            return "In Review";

        case "completed":
            return "Completed";

        default:
            return status || "Unknown";

    }

}



// =========================================
// STATUS CLASS
// =========================================

function getStatusClass(status) {

    return (
        "project-status " +
        "status-" +
        String(status || "unknown")
            .replaceAll("_", "-")
    );

}



// =========================================
// CREATE ROW
// =========================================

function createProjectRow(project) {

    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>

            <div class="project-primary">

                <strong>
                    ${escapeHtml(
                        project.project_name ||
                        "Untitled Project"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        project.project_reference
                    )}
                </span>

            </div>

        </td>


        <td>

            <div class="project-client">

                <strong>
                    ${escapeHtml(
                        project.client_name ||
                        "Unknown Client"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        project.project_type ||
                        "—"
                    )}
                </span>

            </div>

        </td>


        <td>

            ${formatMoney(
                project.price_pence
            )}

        </td>


        <td>

            <span
                class="${getStatusClass(
                    project.status
                )}"
            >
                ${escapeHtml(
                    formatStatus(
                        project.status
                    )
                )}
            </span>

        </td>


        <td>

            ${escapeHtml(
                formatDate(
                    project.created_at
                )
            )}

        </td>


        <td>

            <a
                class="project-view-link"
                href="project.html?reference=${encodeURIComponent(
                    project.project_reference
                )}"
            >
                View
            </a>

        </td>

    `;


    return row;

}



// =========================================
// COUNTERS
// =========================================

function updateCounters(projects) {

    totalProjects.textContent =
        projects.length;


    const completed =
        projects.filter(
            project =>
                project.status ===
                "completed"
        );


    const active =
        projects.filter(
            project =>
                project.status !==
                "completed"
        );


    activeProjects.textContent =
        active.length;


    completedProjects.textContent =
        completed.length;

}



// =========================================
// RENDER
// =========================================

function renderProjects(projects) {

    projectsTableBody.innerHTML =
        "";


    updateCounters(
        projects
    );


    if (
        projects.length === 0
    ) {

        projectsLoading.hidden =
            true;

        projectsEmpty.hidden =
            false;

        return;

    }


    for (
        const project of projects
    ) {

        projectsTableBody.appendChild(
            createProjectRow(
                project
            )
        );

    }


    projectsLoading.hidden =
        true;

    projectsContent.hidden =
        false;

}



// =========================================
// LOAD
// =========================================

async function loadProjects() {

    try {

        const response =
            await fetch(
                "/api/admin/projects"
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                "Unable to load projects."
            );

        }


        renderProjects(
            data.projects || []
        );


    } catch (error) {

        console.error(
            "Projects error:",
            error
        );


        projectsLoading.hidden =
            true;

        projectsError.hidden =
            false;

    }

}



// =========================================
// HTML SAFETY
// =========================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}



// =========================================
// START
// =========================================

loadProjects();