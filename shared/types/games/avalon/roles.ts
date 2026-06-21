export type TRoles = TOptionalRoles | TRequiredRoles;

export type TGoodRoles = TGoodOptionalRoles | TGoodRequiredRoles;

export type TEvilRoles = TEvilOptionalRoles | TEvilRequiredRoles;

export type TUnknownRoles = 'unknown' | 'mysteryWizard' | 'unknownLancelot';

export type TGoodOptionalRoles =
  | 'merlin'
  | 'percival'
  | 'merlinPure'
  | 'tristan'
  | 'isolde'
  | 'goodLancelot'
  | 'guinevere'
  | 'troublemaker'
  | 'cleric';

export type TGoodRequiredRoles = 'servant';

export type TEvilOptionalRoles =
  | 'morgana'
  | 'oberon'
  | 'mordred'
  | 'evilLancelot'
  | 'trickster'
  | 'lunatic'
  | 'brute'
  | 'witch'
  | 'revealer'
  | 'wraith';

export type TEvilRequiredRoles = 'minion';

export type TOptionalRoles = TGoodOptionalRoles | TEvilOptionalRoles;

export type TRequiredRoles = TEvilRequiredRoles | TGoodRequiredRoles;

export type TLoyalty = 'evil' | 'good';

export type TVisibleRole = TRoles | TUnknownRoles | 'evil' | 'good';
