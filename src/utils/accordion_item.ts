import type { CampaignStatus } from "../api/Data";

export interface AccordionItem {
	title: string;
	url?: string;
	img_url: string;
	id: string;
	purchased: boolean;
	status: CampaignStatus;
}
