import "/src/styles/base.css";
import "/src/styles/scroll-shadow.css";
import "/src/styles/tailwind.css";
import "/src/styles/back-end/index.css";

import "./back-end/delete-entry-modal.js";
import "./back-end/preview-upload.js";
import "./back-end/paste-clipboard-image.js";
import "./back-end/reset-form.js";
import "./back-end/delete-uploaded-image.js";
import "./back-end/drag-n-drop-upload.js";
import "./back-end/close-modal.js";
import "./back-end/preview-modal.js";
import "./back-end/display-pagination-shortcut.js";
import "./back-end/tooltip-manager.js";
import "./back-end/breadcrumb-modal.js";
import "/src/scripts/store-scroll-position.utils";

if (process.env.NODE_ENV === "development") {
    await import("./profiler-bar");
}
