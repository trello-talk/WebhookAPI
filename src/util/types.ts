export interface TrelloPayload<T extends TrelloDefaultAction> {
  action: {
    type: string;
    id: string;
    idMemberCreator: string;
    date: string;
    memberCreator: TrelloUser;
    member?: TrelloUser;
    data: T;
    display: any;
  };
  model: Required<TrelloBoard> & {
    idOrganization: string;
    pinned: boolean;
    url: string;
    shortUrl: string;
  };
}

type TrelloPermissionLevel = 'public' | 'private' | 'org' | 'observers';
type TrelloBackgroundBrightness = 'dark' | 'light';
type TrelloBackgroundSize = 'normal' | 'full';
type TrelloColor = 'green' | 'yellow' | 'red' | 'orange' | 'lime' | 'purple' | 'blue' | 'sky' | 'pink' | 'black';

export interface TrelloScaledImage {
  width: number;
  height: number;
  url: string;
}

export interface TrelloUser {
  id: number;
  avatarHash?: string;
  fullName?: string;
  avatarUrl?: string;
  username: string;
  initials: string;
}

export interface TrelloDefaultAction {
  type: string;
  data: {
    old?: any;
    plugin?: TrelloPlugin;
    board: TrelloBoard;
    boardTarget?: TrelloBoard;
    boardSource?: TrelloBoard;
    label?: TrelloLabel;
    list?: TrelloList;
    listBefore?: TrelloList;
    listAfter?: TrelloList;
    card?: TrelloCard;
    cardSource?: TrelloCardSource;
    checklist?: any;
    sourceChecklist?: any;
    checklistItem?: any;
    customField?: any;
    customFieldItem?: any;
    idOriginalCommenter?: string;
    text?: string;
    voted?: boolean;
  };
}

export interface TrelloPlugin {
  id: string;
  idOrganizationOwner: string;
  author: string;
  capabilities: any[];
  capabilitiesOptions: any[];
  categories: any[][];
  iframeConnectorUrl: string;
  name: string;
  privacyUrl: string;
  public: boolean;
  moderatedState: null;
  supportEmail: string;
  url: string;
  tags: any;
  heroImageUrl: any;
  isCompliantWithPrivacyStandards: null;
  usageBrackets: any;
  claimedDomains: any[];
  icon: any;
  listing: any;
}

export interface TrelloBoard {
  id: string;
  name: string;
  shortLink: string;
  desc?: string;
  closed?: boolean;
  prefs?: {
    permissionLevel: TrelloPermissionLevel;
    voting: TrelloPermissionLevel;
    comments: TrelloPermissionLevel;
    invitations: TrelloPermissionLevel;
    selfJoin: boolean;
    cardCovers: boolean;
    canBePublic: boolean;
    canBeOrg: boolean;
    canBePrivate: boolean;
    canInvite: boolean;
  };
  labelNames?: {
    [key: string]: string;
  };
}

export interface TrelloList {
  id: string;
  name: string;
  pos?: number;
  closed?: boolean;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: TrelloColor;
}

export interface TrelloCard {
  id: string;
  name: string;
  idShort: number;
  shortLink: string;
  desc?: string;
  idList?: string;
  closed?: boolean;
  dueComplete?: boolean;
  due?: string;
  dueReminder?: number | null;
  idAttachmentCover?: string;
  cover?: {
    brightness: TrelloBackgroundBrightness;
    size: TrelloBackgroundSize;
    color: TrelloColor;
    scaled?: Array<TrelloScaledImage>;
    imageUrl?: string;
  };
}

export type TrelloCardSource = Pick<TrelloCard, 'id' | 'name' | 'idShort' | 'shortLink'>;
