export interface ErrorResponse {
	status_code: number;
	message: string;
}

export interface CampaignItem {
	ordinal: number;
	name: string;
	price: number;
	// null for new items. Server should always send not null value.
	uuid?: string;
	type: OrderedItemType;
}

export enum CampaignStatus {
	// open for new orders
	ACTIVE,
	// not delivered and closed for new orders
	CLOSED,
	// a proposal from users
	DRAFT,
	// delivered
	ARCHIVED,
	// to be trashed - check if not mistake ;)
	DELETED,
	// proposal that will be active
	DRAFT_CONFIRMED,
	// proposal that will not be active
	DRAFT_DENIED,
	// conditions negotiated
	DRAFT_NEGOTIATED,
}

export enum OrderStatus {
	// open for new orders
	ACTIVE,
	// closed for order waiting for production
	CLOSED,
	// sent to backers
	SENT,
	// order deleted
	DELETED,
}

export interface Campaign {
	uuid: string;
	title: string;
	img_url: string;
	url: string;
	payment_details: string;
	items: CampaignItem[];
	status: CampaignStatus;
	description: string;
	added_date: Date;
	due_date: Date;
}

export interface OrderedItem {
	item_uuid: string;
	amount: number;
	ordinal: number;
	ouuid: string;
	item_type: OrderedItemType;
}

export interface OrderedItemAdmin {
	item_uuid: string;
	amount: number;
}

export enum OrderedItemType {
	PLEDGE,
	SHIPPING,
	ADMIN_ADDON,
}

export interface Order {
	campaign_uuid: string;
	order_uuid: string;
	order_date: Date;
	tracking_no: string;
	status: OrderStatus;
	ouuid: string;
	items: OrderedItem[];
	paid_amount: number;
}

export interface OrderUpdate {
	items: OrderedItem[];
	is_new: boolean;
}

export interface AssignedToUser {
	username: string;
	firstname: string;
	lastname: string;
}

export interface CampaignCandidate {
	uuid: string;
	title: string;
	url: string;
	img_url: string;
	liking_users: string[];
	description: string;
	status: CampaignStatus;
}

export interface CampaignsSearchParams {
	status?: CampaignStatus;
	titleLike?: string;
	uuids?: string[];
}

export interface CampaignUpdate {
	campaign: Campaign;
	candidate_uuid?: string;
	is_new: boolean;
}

export interface User {
	uuid: string;
	username: string;
	activated: boolean;
	firstname: string;
	lastname: string;
	inpost: string;
	zip: string;
}

export interface UserProfile {
	uuid: string;
	username: string;
	activated: boolean;
	firstname: string;
	lastname: string;
	phone: string;
	email: string;
	street: string;
	city: string;
	zip: string;
	inpost: string;
}

export interface Api {
	fetchCampaignOrders(
		campaign_uuid: string
	): Promise<(Order & AssignedToUser)[]>;
	fetchUserOrders(): Promise<Order[]>;
	fetchUserOrdersAdmin(ouuid: string): Promise<Order[]>;
	fetchOrder(order_uuid: string): Promise<Order>;
	updatePaidAmount(order: Order & AssignedToUser): Promise<Order>;
	updateOrderTracking(order: Order): Promise<Order>;
	changeUserOrderStatus(
		user_uuid: string,
		campain_uuid: string,
		order_uuid: string,
		status: OrderStatus
	);
	fetchKSCampaigns(name: string): Promise<CampaignCandidate[]>;
	fetchCampaign(uuid: string): Promise<Campaign>;

	orderCampaign(uuid: string, items: OrderUpdate): Promise<Order>;
	patchOrder(
		uuid: string,
		ouiid: string,
		item: OrderedItemAdmin[]
	): Promise<Order>;

	updateCampaign(update: CampaignUpdate): Promise<Campaign>;
	addCandidate(
		draft: CampaignCandidate
	): Promise<CampaignCandidate> | Promise<ErrorResponse>;

	patchCandidate(
		draft: CampaignCandidate
	): Promise<CampaignCandidate & ErrorResponse>;

	fetchCampaigns(params: CampaignsSearchParams): Promise<Campaign[]>;
	changeStatus(uuid: string, newStatus: CampaignStatus): Promise<Campaign>;
	fetchCampaignCandidate(uuid: string): Promise<CampaignCandidate>;
	fetchCampaignCandidates(
		titleLike: string | null
	): Promise<CampaignCandidate[]>;
	likeCandidate(uuid: string): Promise<CampaignCandidate>;
	unlikeCandidate(uuid: string): Promise<CampaignCandidate>;
	fetchUsers(): Promise<User[]>;
	fetchUserProfile(): Promise<UserProfile>;
	fetchUserProfileAdmin(uuid: string): Promise<UserProfile>;
	activateUser(user_uuid: string): Promise<User>;
	deactivateUser(user_uuid: string): Promise<User>;
	updateUserProfile(user: UserProfile): Promise<UserProfile>;
	resetPassword(password: string, token: string): Promise<Boolean>;
	initPasswordReset(email: string): Promise<Boolean>;
}
