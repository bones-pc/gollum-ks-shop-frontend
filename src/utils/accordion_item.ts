export interface AccordionItem {
	title: string;
	url?: string;
	img_url: string;
	id: string;
	purchased?: boolean;
	due_date?: Date;
	added_date?: Date;
	description?: string;
}
