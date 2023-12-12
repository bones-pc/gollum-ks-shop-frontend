<script lang="ts">
  import { Link, useNavigate } from "svelte-navigator";
  import {
    api,
    Campaign,
    CampaignStatus,
    ErrorResponse,
    ResponseStatusCode,
  } from "../../api/Api";
  import { role } from "../../stores";
  import { permissions } from "../../authentication/roles";
  import AccordionList from "../../utils/AccordionList.svelte";
  import SortPicker from "../../utils/SortPicker.svelte";
  import type { AccordionItem } from "../../utils/accordion_item";
  import { _ } from "svelte-i18n";
  import { Toast } from "bootstrap";
  import { marked } from "marked";
  import SimpleToast from "../../utils/SimpleToast.svelte";
  import Modal from "../../utils/Modal.svelte";

  const navigate = useNavigate();
  const fetch_filter = { status: CampaignStatus.ACTIVE };
  let showPopup = false;
  let active_campaigns = [];

  let toast_message = "";
  let toast_id = Math.floor(Math.random() * 1000) + "active_draft_toast";
  function showToast(text: string, path: string) {
    toast_message = text;
    let my_toast_el = document.getElementById(toast_id);
    let toast = new Toast(my_toast_el);
    setTimeout(() => {
      navigate(path);
      toast.hide();
    }, 2000);
  }
  function add_new_campaign() {
    navigate(`/campaigns/add`);
  }

  async function lock(uuid: string) {
    const response: Campaign | ErrorResponse = await api.changeStatus(
      uuid,
      CampaignStatus.CLOSED
    );
    if (
      (response as ErrorResponse).status_code === ResponseStatusCode.NOT_ALLOWED
    )
      showToast("Brak uprawnień", "/");
    active_campaigns = await fetch(null);
  }

  let modal_text = "";
  async function fetchBuyers(campaign_uuid) {
    const buyers = await api.fetchCampaignBuyer(campaign_uuid);
    let count = 0;
    if (buyers) {
      modal_text = buyers
        .sort((a, b) => {
          a < b ? 0 : 1;
        })
        .reduce((a, c) => {
          if (!c) {
            c = "";
          } else count++;
          return `${a}<br>${c}`;
        }, "");
    }
    if (!count) modal_text = "<br>nikt ???";
    showPopup = true;
  }

  async function fetch(search: string): Promise<AccordionItem[]> {
    const campaigns = await api.fetchCampaigns({
      titleLike: search,
      ...fetch_filter,
    });
    if (
      (campaigns as ErrorResponse).status_code ===
      ResponseStatusCode.NOT_ALLOWED
    ) {
      showToast("Brak uprawnień", "/");
      return [];
    }
    return (campaigns as Campaign[]).map(
      ({
        uuid,
        title,
        url,
        img_url,
        description,
        payment_details,
        due_date,
        added_date,
        purchased,
        status,
      }) => ({
        id: uuid,
        title,
        url,
        img_url,
        description,
        payment_details,
        due_date,
        added_date,
        purchased,
        status,
      })
    );
  }
  let sort_by_list = ["nazwie", "dacie zakończenia", "dacie dodania"];
  let sort_headline = "Sortuj po ";
  let sort_option = 0;
  function sort_by_name(a: AccordionItem, b: AccordionItem) {
    if (a.title > b.title) {
      return 1;
    }
    if (a.title < b.title) {
      return -1;
    }
    return 0;
  }
  function sort_by_date(a, b) {
    if (a.due_date > b.due_date) {
      return 1;
    }
    if (a.due_date < b.due_date) {
      return -1;
    }
    return 0;
  }
  function sort_by_added_date(a, b) {
    if (a.added_date > b.added_date) {
      return 1;
    }
    if (a.added_date < b.added_date) {
      return -1;
    }
    return 0;
  }
  async function sort() {
    active_campaigns = await fetch(null);
    if (sort_option == 1) {
      active_campaigns.sort(sort_by_date);
      return;
    } else if (sort_option == 2) {
      active_campaigns.sort(sort_by_added_date);
      return;
    }
    active_campaigns.sort(sort_by_name);
  }
  function show_legend() {
    return true;
  }
</script>

<h1>{$_("active_campaigns.title")}</h1>

<AccordionList items_provider={fetch} items={active_campaigns}>
  <svelte:fragment slot="nav-actions">
    {#if $role.is_admin() || $role.is_moderator()}
      <button type="button" class="btn btn-primary" on:click={add_new_campaign}>
        + {$_("active_campaigns.add_campaign")}
      </button>
    {/if}
    <SortPicker
      headline={sort_headline}
      onChangeHandler={sort}
      {sort_by_list}
      bind:selected={sort_option}
    />
  </svelte:fragment>
  <svelte:fragment slot="item-actions" let:item>
    <ul>
      <li>
        <Link to="/order/{item.id}">{$_("active_campaigns.order")}</Link>
      </li>
      <li>
        <a
          href="#"
          on:click={() => {
            fetchBuyers(item.id);
          }}>Kto bierze?</a
        >
      </li>
      {#if $role.check_role(permissions.campaign.UPDATE)}
        <li>
          <Link to="/campaigns/edit/{item.id}">
            {$_("active_campaigns.edit")}
          </Link>
        </li>
      {/if}
      {#if $role.check_role(permissions.orders.READ)}
        <li>
          <Link to="/orders/{item.id}">
            {$_("active_campaigns.manage_orders")}
          </Link>
        </li>
      {/if}
      {#if $role.check_role(permissions.campaign.UPDATE)}
        <li>
          <span class="fake-link" on:click={() => lock(item.id)}>
            {$_("active_campaigns.lock")}
          </span>
        </li>
      {/if}
    </ul>
  </svelte:fragment>
</AccordionList>

<Modal
  title={"FOMO?"}
  action={"Cool."}
  small={true}
  open={showPopup}
  onClick={() => (showPopup = false)}
  onClosed={() => (showPopup = false)}
>
  Rozumiem...{@html marked(modal_text)}
</Modal>

<SimpleToast {toast_id}
  ><div slot="toast-body">{toast_message}</div></SimpleToast
>
