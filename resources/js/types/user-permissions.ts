export type PermissionModuleDefinition = {
    key: string;
    label: string;
    indent: boolean;
};

export type PermissionState = 'default' | 'allow' | 'deny';

export type UserPermissionsResponse = {
    modules: PermissionModuleDefinition[];
    overrides: Record<string, 'allow' | 'deny'>;
};
