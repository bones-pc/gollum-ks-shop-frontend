import type { CampaignStatus } from "../api/Data";

export interface AccordionItem {
  title: string;
  url?: string;
  img_url: string;
  id: string;
  status: CampaignStatus;
  purchased?: boolean;
  due_date?: Date;
  added_date?: Date;
  description?: string;
}
