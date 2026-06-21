export type TVoteOption = 'approve' | 'reject';

export interface TeamMember {
  id: string;
  preVote?: TVoteOption;
}

export interface PreVoteData {
  playerID: string;
  value: TVoteOption;
}
