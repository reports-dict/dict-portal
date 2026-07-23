export function hasModulePermission(
    permittedModules: string[] | null,
    key: string,
): boolean {
    return permittedModules === null || permittedModules.includes(key);
}
