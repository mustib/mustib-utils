type Categories = {
  node: 'envvars' | 'getdirname' | 'typedeventemitter';
  browser: 'getelementboundaries' | 'getscrollbarwidth' | 'enableelementscroll' | 'disableelementscroll';
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
  return `/mustib-utils/v2/utilities/${category}/${utility}/${id ? `#${id}` : ''}`;
}

type Constants = [
  'index',
  'LIBRARY_ERROR_SCOPE',
]

export function getConstantUrl<Constant extends Constants[number]>(
  constant: Constant,
  id?: string
) {
  return `/mustib-utils/v2/constants/${constant === 'index' ? 'getting-started' : `list/${constant.toLowerCase()}`}/${id ? `#${id}` : ''}`;
}