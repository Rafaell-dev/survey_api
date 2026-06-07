/**
 * Remove recursivamente campos sensíveis (como IDs de pesquisa, senhas, e metadados de criação/atualização)
 * para não vazarem nas respostas dos participantes.
 */
export function stripAdminFields(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(stripAdminFields);
  } else if (obj !== null && typeof obj === 'object') {
    if (obj instanceof Date) return obj;

    const newObj: any = {};
    for (const key in obj) {
      if (['researcherId', 'userId', 'password', 'sessions', 'tokens', 'createdAt', 'updatedAt'].includes(key)) {
        continue;
      }
      newObj[key] = stripAdminFields(obj[key]);
    }
    return newObj;
  }
  return obj;
}
