// ═══════════════════════════════════════
//  iBilib — Shared TypeScript Types
// ═══════════════════════════════════════

/** User roles supported by the system */
export type UserRole = 'student' | 'teacher' | 'private';

/** A row from the `profiles` Supabase table */
export interface UserProfile {
    id: string;
    role: UserRole;
    full_name: string | null;
}

/** Augmented account entry used by Account Manager */
export interface AccountEntry {
    id: string;
    name: string;
    email: string;
    role: UserRole | 'unknown';
    hasProfile: boolean;
}

/** Role display metadata */
export interface RoleMeta {
    label: string;
    color: string;
    bg: string;
    icon: string;
}

/** A document/file retrieved from the database */
export interface LibDocument {
    id: string;
    title: string;
    folder: string;
    org: string;
    url: string;
    created_at?: string;
}

/** A folder/category retrieved from the database */
export interface LibFolder {
    name: string;
    org: string;
    isActive?: boolean;
}

/** Toast message types */
export type ToastType = 'error' | 'success' | 'info';

/** Pending role-change record for Account Manager confirm dialog */
export interface PendingRoleChange {
    id: string;
    name: string;
    oldRole: string;
    newRole: string;
    hasProfile: boolean;
    selectEl: HTMLSelectElement;
}
