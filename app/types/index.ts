export * from '#shared/types';

import type { PublicUserProfile } from '#shared/types';

export type TLanguage = 'en' | 'zh-cn' | 'zh-tw' | 'ru' | 'es' | 'pt';

export interface IUserSettings {
  locale?: { value: TLanguage; isDefault: boolean };
  hideIndexInHistory?: boolean;
  colorTheme?: 'light' | 'dark';
  style?: 'default' | 'anime';
}

export type TUserState =
  | {
      status: 'loading';
    }
  | {
      status: 'ready';
      profile: PublicUserProfile;
    };

export type TAlertsName = 'discordchat';

export type TAlerts = {
  [key in TAlertsName]?: number;
};
