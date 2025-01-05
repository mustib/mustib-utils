type Categories = {
  node: 'envvars' | 'getdirname' | 'typedeventemitter';
  browser: 'getelementboundaries' | 'getscrollbarwidth';
  common:
    | 'apperror'
    | 'capitalize'
    | 'customeventemitter'
    | 'gettypeof'
    | 'mergetwoobjects'
    | 'millisecondsfromstring'
    | 'stringfrommilliseconds'
    | 'parsejson'
    | 'types';
};

export function getUtilityUrl<Category extends keyof Categories>(
  category: Category,
  utility: Categories[Category],
  id?: string,
) {
  return `/v1/utilities/${category}/${utility}/${id ? `#${id}` : ''}`;
}
