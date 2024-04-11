export interface Role {
	is_admin(): boolean;
	is_anonymous(): boolean;
	is_moderator(): boolean;
	is_expired(): boolean;

	check_role(role: string): boolean;
}

export const permissions = {
	campaign: {
		READ: "campaign.read",
		CREATE: "campaign.create",
		UPDATE: "campaign.update",
		DELETE: "campaign.delete",
	},
	draft: {
		READ: "draft.read",
		CREATE: "draft.create",
		UPDATE: "draft.update",
		DELETE: "draft.delete",
	},
	own_orders: {
		READ: "own_order.read",
		CREATE: "own_order.create",
		UPDATE: "own_order.update",
		DELETE: "own_order.delete",
	},
	orders: {
		READ: "order.read",
		CREATE: "order.create",
		UPDATE: "order.update",
		DELETE: "order.delete",
	},
	user: {
		READ: "user.read",
		CREATE: "user.create",
		UPDATE: "user.update",
		DELETE: "user.delete",
	},
	pledge: {
		READ: "pledge.read",
		CREATE: "pledge.create",
		UPDATE: "pledge.update",
		DELETE: "pledge.delete",
	},
};

const roles = {
	ADMIN: "admin",
	USER: "user",
	ANONONYMOUS: "anonymous",
	MODERATOR: "moderator",
	CAMPAIGN: "campaign",
	ORDER: "order",
	EXPIRED: "expired",
};

const role_permissions = {
	ADMIN: [],

	MODERATOR: [
		permissions.campaign.READ,
		permissions.campaign.UPDATE,

		permissions.own_orders.READ,
		permissions.own_orders.UPDATE,
		permissions.own_orders.CREATE,
		permissions.own_orders.DELETE,

		permissions.orders.READ,

		permissions.pledge.READ,

		permissions.draft.READ,
		permissions.draft.CREATE,
	],
	USER: [
		permissions.campaign.READ,

		permissions.own_orders.READ,
		permissions.own_orders.UPDATE,
		permissions.own_orders.CREATE,

		permissions.pledge.READ,

		permissions.draft.READ,
		permissions.draft.CREATE,
	],

	ANONYMOUS: [],
	EXPIRED: [permissions.own_orders.READ],
};

export class Anonymous implements Role {
	is_admin(): boolean {
		return false;
	}
	is_moderator(): boolean {
		return false;
	}
	is_anonymous(): boolean {
		return true;
	}
	is_expired(): boolean {
		return true;
	}
	check_role(role: string): boolean {
		if (role_permissions.ANONYMOUS.includes(role)) return true;
		return false;
	}
}

export class LoggedUser implements Role {
	is_admin(): boolean {
		return false;
	}
	is_moderator(): boolean {
		return false;
	}
	is_anonymous(): boolean {
		return false;
	}

	is_expired(): boolean {
		return false;
	}
	check_role(role: string): boolean {
		if (role_permissions.USER.includes(role)) return true;
		return false;
	}
}

export class Admin implements Role {
	is_admin(): boolean {
		return true;
	}
	is_moderator(): boolean {
		return false;
	}
	is_anonymous(): boolean {
		return false;
	}
	is_expired(): boolean {
		return false;
	}
	check_role(role: string): boolean {
		// if (role_permissions.ADMIN.includes(role)) return true;
		return true;
	}
}

export class Moderator implements Role {
	is_admin(): boolean {
		return false;
	}
	is_moderator(): boolean {
		return true;
	}
	is_anonymous(): boolean {
		return false;
	}
	is_expired(): boolean {
		return false;
	}
	check_role(role: string): boolean {
		if (role_permissions.MODERATOR.includes(role)) return true;
		return false;
	}
}

export class ExpiredUser implements Role {
	is_admin(): boolean {
		return false;
	}
	is_anonymous(): boolean {
		return false;
	}
	is_moderator(): boolean {
		return false;
	}
	is_expired(): boolean {
		console.log("EXPIRED");
		return true;
	}
	check_role(role: string): boolean {
		console.log("check, expired", role);
		if (role_permissions.EXPIRED.includes(role)) return true;
		return false;
	}
}
