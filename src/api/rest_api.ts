import { get } from "svelte/store";
import { access_token, api_url as url, user_uuid } from "../stores";
import {
	Api,
	AssignedToUser,
	Campaign,
	CampaignCandidate,
	CampaignsSearchParams,
	CampaignStatus,
	CampaignUpdate,
	Order,
	OrderStatus,
	OrderUpdate,
	User,
	UserProfile,
	ErrorResponse,
	OrderedItemAdmin,
	ResponseStatusCode,
} from "./Data";

const api_url = get(url);

function backend_campaign_to_frontend_campaign(campaign: any): Campaign {
	return {
		uuid: campaign.uuid,
		title: campaign.name,
		img_url: campaign.img_url,
		payment_details: campaign.payment_details,
		items: campaign.items?.map((i, index) => ({
			uuid: i.uuid,
			ordinal: i.ordinal,
			name: i.name,
			price: i.price,
			type: i.type,
		})),
		url: campaign.url,
		status: campaign.status as CampaignStatus,
		description: campaign.description,
		added_date: campaign.added_date,
		end_date: campaign.end_date,
		due_date: campaign.due_date,
		purchased: campaign.purchased,
		liking_users: campaign.liking_users,
		likes: campaign.liking_users.length,
	};
}

function backend_draft_to_frontend_draft(
	draft: any
): CampaignCandidate & ErrorResponse {
	return {
		uuid: draft.uuid,
		title: draft.name || draft.campaign_name,
		img_url: draft.img_url,
		added_date: draft.added_date,
		url: draft.url,
		// todo - Piotr should fix it soon
		liking_users: draft?.liking_users?.filter((it) => it != null),
		description: draft.description,
		status: draft.status,
		purchased: false,
		demotion: draft.demotion,
		status_code: ResponseStatusCode.OK,
		message: "ok",
	};
}

function backend_user_to_frontend_user(user: any): User {
	return {
		uuid: user.uuid,
		activated: user.active,
		username: user.username,
		firstname: user.firstname,
		lastname: user.lastname,
		inpost: user.inpost,
		zip: user.zip,
	};
}

function backend_order_to_frontend_order(order: any): Order {
	return {
		campaign_uuid: order.uuid,
		order_uuid: order.order_uuid,
		order_date: order.order_date,
		ouuid: order.ouuid,
		status: order.status,
		tracking_no: order.tracking_no,
		paid_amount: Number.parseInt(order.paid_amount),
		user_paid: Number.parseFloat(order.user_paid),
		items: order.items?.map((i) => ({
			item_uuid: i.uuid,
			amount: Number.parseInt(i.amount),
		})),
	};
}

export class RestApi {
	addCandidate(
		draft: CampaignCandidate
	): Promise<CampaignCandidate | ErrorResponse> {
		return (async () => {
			let error_response: ErrorResponse = {};
			const payload: CampaignCandidate = { ...draft };
			payload.status = CampaignStatus.DRAFT; //.toString();
			const response = await fetch(
				api_url + "campaigns",
				options("POST", payload)
			);
			if (response.ok) {
				const response_json = await response.json();
				return backend_draft_to_frontend_draft(response_json);
			} else if (response.status == 403) {
				error_response = {
					status_code: ResponseStatusCode.NOT_ALLOWED,
					message: "Brak uprawnień",
				};
			} else {
				error_response = {
					status_code: ResponseStatusCode.ALREADY_EXISTS,
					message: "Kampania już istnieje",
				};
			}
			return error_response;
		})();
	}

	async patchCandidate(
		draft: CampaignCandidate
	): Promise<CampaignCandidate | ErrorResponse> {
		let error_response: ErrorResponse = {
			status_code: ResponseStatusCode.OK,
			message: "ok",
		};
		let candidate: CampaignCandidate;
		let candidate_response: CampaignCandidate | ErrorResponse;

		let payload = draft;
		// payload.status = CampaignStatus.DRAFT;
		const response = await fetch(
			api_url + "campaigns",
			options("PATCH", payload)
		);
		if (response.ok) {
			const response_json = await response.json();
			candidate_response = backend_draft_to_frontend_draft(response_json);
		} else {
			error_response.status_code = ResponseStatusCode.NOT_ALLOWED;
			error_response.message = "brak uprawnień";
			candidate_response = error_response;
		}
		return candidate_response;
	}

	fetchKSCampaigns(name: string): Promise<CampaignCandidate[]> {
		return (async () => {
			const payload = {
				ks_search: name,
			};
			const response = await fetch(
				api_url + "kickstarter",
				options("POST", payload)
			);
			if (response.ok) {
				const response_json = await response.json();
				return response_json;
			}
		})();
	}

	fetchCampaignOrders(
		campaign_uuid: string
	): Promise<(Order & AssignedToUser)[]> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + campaign_uuid + "/orders",
				options("GET")
			);
			if (response.ok) {
				const response_json = await response.json();
				const results = [];
				for (let username in response_json) {
					let lastname = response_json[username].lastname;
					let firstname = response_json[username].firstname;
					results.push({
						username,
						firstname,
						lastname,
						...backend_order_to_frontend_order(response_json[username]),
					});
				}
				return results;
			}
		})();
	}

	fetchUserOrdersAdmin(user_uuid: string): Promise<Order[]> {
		return (async () => {
			const response = await fetch(
				api_url + "users/" + user_uuid + "/orders",
				options("GET")
			);
			if (response.ok) {
				const response_json = await response.json();
				return response_json.map(backend_order_to_frontend_order);
			}
		})();
	}

	fetchUserOrders(): Promise<Order[] | ErrorResponse> {
		return (async () => {
			const response = await fetch(api_url + "orders", options("GET"));
			if (response.ok) {
				const response_json = await response.json();
				return response_json.map(backend_order_to_frontend_order);
			} else {
				let error_reposne: ErrorResponse = {};
				error_reposne.status_code = ResponseStatusCode.NOT_ALLOWED;
				error_reposne.message = "Brak uprawnień";
				return error_reposne;
			}
		})();
	}

	fetchOrder(campaign_uuid: string): Promise<Order> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + campaign_uuid + "/order",
				options("GET")
			);
			if (response.ok) {
				const response_json = await response.json();
				if (response_json.uuid == null) {
					return null;
				}
				return backend_order_to_frontend_order(response_json);
			}
		})();
	}

	updatePaidAmount(order: Order & AssignedToUser): Promise<Order> {
		return (async () => {
			const payload = {
				paid_amount: order.paid_amount,
				campaign_uuid: order.campaign_uuid,
				order_uuid: order.order_uuid,
			};
			const response = await fetch(
				api_url + "campaigns/" + order.campaign_uuid + "/order",
				options("PATCH", payload)
			);
			if (response.ok) {
				const response_json = await response.json();
				return backend_order_to_frontend_order(response_json.result[0]);
			}
		})();
	}

	updateOrderTracking(order: Order & AssignedToUser): Promise<Order> {
		return (async () => {
			const payload = {
				tracking_no: order.tracking_no,
				campaign_uuid: order.campaign_uuid,
				order_uuid: order.order_uuid,
			};
			const response = await fetch(
				api_url + "campaigns/" + order.campaign_uuid + "/order",
				options("PATCH", payload)
			);
			if (response.ok) {
				const response_json = await response.json();
				return response_json.result;
			}
		})();
	}

	fetchCampaign(uuid: string): Promise<Campaign | ErrorResponse> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + uuid,
				options("GET")
			);
			if (response.ok) {
				const response_json = await response.json();
				if (response_json.length > 0) {
					return backend_campaign_to_frontend_campaign(response_json[0]);
				}
			} else {
				let error_response: ErrorResponse;
				error_response.status_code = ResponseStatusCode.NOT_ALLOWED;
				error_response.message = "brak uprawnień";
				return error_response;
			}
		})();
	}

	updateUserPaidAmount(
		campaign_uuid: string,
		user_paid: number
	): Promise<Order | ErrorResponse> {
		return (async () => {
			const payload = {
				items: [],
				user_paid,
			};
			let error_response: ErrorResponse = {
				status_code: ResponseStatusCode.NOT_ALLOWED,
				message: "Brak zamówienia lub kampania zamknięta.",
			};
			const response = await fetch(
				api_url + "campaigns/" + campaign_uuid + "/order",
				options("PATCH", payload)
			);
			if (response.ok) {
				const response_json = await response.json();
				if (response_json.status === 400) {
					return error_response;
				}
				return backend_order_to_frontend_order(response_json.result[0]);
			} else if (response.status === 403) {
				const error_response: ErrorResponse = {
					status_code: ResponseStatusCode.NOT_ALLOWED,
					message: "Brak uprawnień",
				};
				console.log(error_response);
				return error_response;
			}
		})();
	}
	orderCampaign(
		campaign_uuid: string,
		update: OrderUpdate,
		user_paid?: number
	): Promise<Order | ErrorResponse> {
		console.log(campaign_uuid, update, user_paid);
		return (async () => {
			const payload = {
				items: update?.items?.map((it) => ({
					pledge_id: it.item_uuid,
					amount: it.amount,
				})),
				user_paid,
			};
			let error_response: ErrorResponse = {
				status_code: ResponseStatusCode.NOT_FOUND,
				message: "Brak zamówienia lub kampania zamknięta.",
			};
			const response = update.is_new
				? await fetch(
						api_url + "campaigns/" + campaign_uuid + "/order",
						options("POST", payload)
				  )
				: await fetch(
						api_url + "campaigns/" + campaign_uuid + "/order",
						options("PATCH", payload)
				  );
			if (response.ok) {
				const response_json = await response.json();
				console.log(response_json);
				if (response_json.status === 400) {
					return error_response;
				}
				return backend_order_to_frontend_order(response_json.result[0]);
			}
		})();
	}

	patchOrder(
		order_uuid: string,
		ouuid: string,
		items: OrderedItemAdmin[]
	): Promise<Order> {
		return (async () => {
			const payload = {
				ouuid: ouuid,
				items: items,
			};
			const response = await fetch(
				api_url + "orders/" + order_uuid,
				options("PATCH", payload)
			);
			if (response.ok) {
				const response_json = await response.json();
				return backend_order_to_frontend_order(response_json.result[0]);
			}
		})();
	}

	updateCampaign(update: CampaignUpdate): Promise<Campaign | ErrorResponse> {
		return (async () => {
			const payload = { ...update.campaign };
			if (update.is_new) {
				payload["uuid"] = update.candidate_uuid ?? null;
			}
			console.log(payload);
			const response =
				update.is_new && update.candidate_uuid == null
					? await fetch(api_url + "campaigns", options("POST", payload))
					: await fetch(api_url + "campaigns", options("PATCH", payload));
			if (response.ok) {
				const response_json = await response.json();
				console.log(response_json);
				return backend_campaign_to_frontend_campaign(response_json.result[0]);
			} else if (response.status === 403) {
				const error_response: ErrorResponse = {
					status_code: ResponseStatusCode.NOT_ALLOWED,
					message: "Brak uprawnień",
				};
				return error_response;
			}
		})();
	}

	fetchCampaigns(params: CampaignsSearchParams): Promise<Campaign[]> {
		const fetch_params = new URLSearchParams();
		if (params.status == null) {
		} else {
			fetch_params.set("status", params.status.toString());
		}
		if (params.titleLike) {
			fetch_params.set("name", params.titleLike);
		}
		if (params.uuids) {
			for (let uuid of params.uuids) {
				fetch_params.append("id", uuid);
			}
		}
		return (async () => {
			const response = await fetch(
				api_url + "campaigns?" + fetch_params.toString(),
				options("GET")
			);
			if (response.ok) {
				const response_json = await response.json();
				return response_json.map(backend_campaign_to_frontend_campaign);
			} else {
				const error_response: ErrorResponse = {
					status_code: ResponseStatusCode.NOT_ALLOWED,
					message: "brak uprawnień",
				};
				return error_response;
			}
		})();
	}

	fetchCampaignBuyer(uuid: string): Promise<string[]> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + uuid + "/purchased",
				options("GET")
			);
			console.log(response);
			if (response.ok) {
				const response_json = await response.json();
				console.log(response_json);
				return response_json;
			}
		})();
	}

	changeStatus(
		uuid: string,
		newStatus: CampaignStatus
	): Promise<Campaign | ErrorResponse> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns",
				options("PATCH", { status: newStatus, uuid })
			);
			if (response.ok) {
				const response_json = await response.json();
				if (response_json.result.length > 0) {
					return backend_campaign_to_frontend_campaign(response_json.result[0]);
				}
			} else if (response.status === 403) {
				const error_response: ErrorResponse = {
					status_code: ResponseStatusCode.NOT_ALLOWED,
					message: "brak uprawnień",
				};
				return error_response;
			}
		})();
	}

	changeUserOrderStatus(
		user_uuid: string,
		campain_uuid: string,
		order_uuid: string,
		status: OrderStatus
	) {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + campain_uuid + "/order",
				options("PATCH", { order_uuid, status: status })
			);
			if (response.ok) {
				const response_json = await response.json();

				if (response_json.result.length > 0) {
					return backend_campaign_to_frontend_campaign(response_json.result[0]);
				}
			}
		})();
	}

	fetchCampaignCandidate(uuid: string): Promise<CampaignCandidate> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + uuid,
				options("GET")
			);
			// console.log(response);
			if (response.ok) {
				const response_json = await response.json();
				if (response_json.length > 0) {
					return backend_draft_to_frontend_draft(response_json[0]);
				}
			}
		})();
	}

	fetchCampaignCandidates(titleLike: string): Promise<CampaignCandidate[]> {
		const fetch_params = new URLSearchParams();
		fetch_params.set("status", CampaignStatus.DRAFT.toString());
		if (titleLike) {
			fetch_params.set("name", titleLike);
		}
		return (async () => {
			const response = await fetch(
				api_url + "campaigns?" + fetch_params.toString(),
				options("GET")
			);
			if (response.ok) {
				const response_json = await response.json();
				return response_json.map(backend_draft_to_frontend_draft);
			}
		})();
	}

	likeCandidate(uuid: string): Promise<CampaignCandidate> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + uuid + "/like",
				options("PUT")
			);
			if (response.ok) {
				// TODO api does not return candidate but we fetch all drafts anyway
				return null;
			}
		})();
	}

	unlikeCandidate(uuid: string): Promise<CampaignCandidate> {
		return (async () => {
			const response = await fetch(
				api_url + "campaigns/" + uuid + "/like",
				options("DELETE")
			);
			if (response.ok) {
				// TODO api does not return candidate but we fetch all drafts anyway
				return null;
			}
		})();
	}

	fetchUsers(): Promise<User[]> {
		return (async () => {
			const response = await fetch(api_url + "users", options("GET"));
			if (response.ok) {
				const response_json = await response.json();
				return response_json.map(backend_user_to_frontend_user);
			}
		})();
	}

	fetchUsersInCSV(): Promise<any> {
		return (async () => {
			const response = await fetch(api_url + "users/csv", options("GET"));
			if (response.ok) {
				const { csv, status } = await response.json();
				return csv;
			}
		})();
	}

	fetchUserProfile(): Promise<UserProfile> {
		return (async () => {
			const response = await fetch(api_url + "users/profile", options("GET"));
			if (response.ok) {
				const response_json = await response.json();
				return response_json;
			}
		})();
	}

	fetchUserProfileAdmin(uuid: string): Promise<UserProfile> {
		return (async () => {
			const response = await fetch(api_url + "users/" + uuid, options("GET"));
			if (response.ok) {
				const response_json = await response.json();
				return response_json;
			}
		})();
	}

	updateUserProfile(user: UserProfile): Promise<UserProfile> {
		return (async () => {
			const response = await fetch(
				api_url + "users/profile",
				options("PATCH", {
					username: user.username,
					firstname: user.firstname,
					lastname: user.lastname,
					email: user.email,
					phone: user.phone,
					street: user.street,
					zip: user.zip,
					city: user.city,
					inpost: user.inpost,
				})
			);
			return response.json();
		})();
	}

	activateUser(user_uuid: string): Promise<User> {
		return (async () => {
			const response = await fetch(
				api_url + "users/" + user_uuid,
				options("PATCH", { active: true })
			);
			if (response.ok) {
				const response_json = await response.json();
				return {
					...backend_user_to_frontend_user(response_json),
					uuid: user_uuid,
				};
			}
		})();
	}

	updateSubscription(user_uuid: string, date: Date): Promise<User> {
		return (async () => {
			const response = await fetch(
				api_url + "users/" + user_uuid,
				options("PATCH", { subscription_due: date })
			);
			if (response.ok) {
				const response_json = await response.json();
				return {
					...backend_user_to_frontend_user(response_json),
					uuid: user_uuid,
				};
			}
		})();
	}

	deactivateUser(user_uuid: string): Promise<User> {
		return (async () => {
			const response = await fetch(
				api_url + "users/" + user_uuid,
				options("PATCH", { active: false })
			);
			if (response.ok) {
				const response_json = await response.json();
				return {
					...backend_user_to_frontend_user(response_json),
					uuid: user_uuid,
				};
			}
		})();
	}

	resetPassword(password: string, token: string): Promise<Boolean> {
		return (async () => {
			let payload = { password, token };

			let url = api_url + "auth/password-reset/";

			const response = await fetch(url, options("PATCH", payload));

			return true;
		})();
	}

	initPasswordReset(email: string): Promise<Boolean> {
		return (async () => {
			let payload = { email };
			let url = api_url + "auth/password-reset/";
			const response = await fetch(url, options("POST", payload));
			return true;
		})();
	}
}

function options(method, body = null): RequestInit {
	return {
		method,
		mode: "cors",
		headers: {
			"Content-type": "application/json",
			Authorization: "Bearer " + get(access_token),
		},
		body: body == null ? null : JSON.stringify(body),
	};
}
