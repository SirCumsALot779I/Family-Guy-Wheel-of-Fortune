import { INVENTORY_LIMIT } from "../shared/constants.js";
import {
  addItemModal,
  addItemInput,
  cancelAddItemBtn,
  closeAddItemBtn,
  closeOnBackdropClick,
  confirmAddItemBtn,
  confirmDeleteBtn,
  confirmDeleteModal,
  confirmDeleteName,
  inventoryBtn,
  inventoryCloseBtn,
  inventoryGrid,
  inventoryModal,
  cancelDeleteBtn
} from "../shared/dom.js";
import { supabaseClient, fetchCurrentUser } from "../shared/supabase-client.js";
import { generateShareLink } from "../names/share-name-list.js";
import { InventoryItem } from "../shared/types.js";
import { extractNamesFromLink, createMiniWheel } from "../wheel/mini-wheel.js";

let pendingDeleteId: string | null = null;

function openDeleteModal(id: string, title: string): void {
  pendingDeleteId = id;
  confirmDeleteName.textContent = title;
  confirmDeleteModal.showModal();
}

async function openInventoryModal(): Promise<void> {
  await loadInventory();
  inventoryModal.showModal();
}

async function confirmDelete(): Promise<void> {
  confirmDeleteModal.close();
  if (!pendingDeleteId) return;

  const success = await deleteItem(pendingDeleteId);
  pendingDeleteId = null;

  if (success) await loadInventory();
}

function cancelDelete(): void {
  confirmDeleteModal.close();
  pendingDeleteId = null;
}

async function deleteItem(id: string): Promise<boolean> {
  const { error } = await supabaseClient
    .from("saved_links")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Fehler beim Löschen:", error);
    return false;
  }
  return true;
}

function openAddItemModal(): void {
  if (!inventoryModal.open) return;

  addItemInput.value = "";
  addItemModal.showModal();

  setTimeout(() => addItemInput.focus(), 60);
}

function closeAddItemModal(): void {
  addItemModal.close();
}

function renderInventory(items: InventoryItem[]): void {
  inventoryGrid.innerHTML = "";
  let addCardPlaced = false;

  for (let i = 0; i < INVENTORY_LIMIT; i++) {
    const item = items[i];

    if (!item) {
      inventoryGrid.appendChild(addCardPlaced ? createEmptyCard() : createAddCard());
      addCardPlaced = true;
      continue;
    }

    inventoryGrid.appendChild(createItemCard(item));
  }
}

function createAddCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-card add";
  card.id = "addCardBtn";
  card.textContent = "+";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.addEventListener("click", openAddItemModal);
  card.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAddItemModal();
    }
  });
  return card;
}

function createEmptyCard(): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "inventory-card empty";
  return card;
}

function hasValidLink(link: string | null): link is string {
  return (link ?? "").trim() !== "";
}

function createCardContainer(item: InventoryItem): HTMLElement {
  if (!hasValidLink(item.link)) {
    const card = document.createElement("div");
    card.classList.add("inventory-card");
    return card;
  }

  const card = document.createElement("a");
  card.classList.add("inventory-card");
  card.href = item.link;
  return card;
}

function createDeleteButton(item: InventoryItem): HTMLButtonElement {
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "inventory-delete-btn";
  deleteBtn.setAttribute("aria-label", "Eintrag loeschen");
  deleteBtn.textContent = "🗑️";
  deleteBtn.addEventListener("click", (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDeleteModal(item.id, item.title);
  });
  return deleteBtn;
}

function createItemCard(item: InventoryItem): HTMLElement {
  const card = createCardContainer(item);

  card.appendChild(buildCardContent(item));

  if (hasValidLink(item.link)) {
    card.appendChild(createDeleteButton(item));
  }

  return card;
}

function buildCardContent(item: InventoryItem): HTMLDivElement {
  const content = document.createElement("div");
  content.className = "inventory-card-content";

  const names = extractNamesFromLink(item.link);
  if (names.length >= 2) {
    const miniWheel = createMiniWheel(names, 65);
    content.appendChild(miniWheel);
  }

  const title = document.createElement("h3");
  title.textContent = item.title;
  content.appendChild(title);

  return content;
}

async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const user = await fetchCurrentUser();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("saved_links")
    .select(`
      id,
      title:link_name,
      link:url
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(INVENTORY_LIMIT);

  if (error) {
    console.error("Fehler beim Laden:", error);
    return [];
  }

  return data ?? [];
}

async function loadInventory(): Promise<void> {
  renderInventory(await fetchInventoryItems());
}

async function submitItem(): Promise<void> {
  const name = addItemInput.value.trim();
  if (!name) {
    addItemInput.focus();
    return;
  }

  const user = await fetchCurrentUser();
  if (!user) return;

  const { error } = await supabaseClient
    .from("saved_links")
    .insert({
      user_id: user.id,
      link_name: name,
      url: generateShareLink()
    });

  if (error) {
    console.error("Fehler beim Speichern:", error);
    return;
  }

  closeAddItemModal();
  await loadInventory();
}

export function initInventory(): void {
  inventoryBtn.addEventListener("click", openInventoryModal);
  inventoryCloseBtn.addEventListener("click", () => inventoryModal.close());
  inventoryModal.addEventListener("click", (e) => {
    const inner = inventoryModal.querySelector(".inventory-content");
    if (inner && !inner.contains(e.target as Node)) {
      inventoryModal.close();
    }
  });

  confirmAddItemBtn.addEventListener("click", submitItem);
  cancelAddItemBtn.addEventListener("click", closeAddItemModal);
  closeAddItemBtn.addEventListener("click", closeAddItemModal);
  addItemInput.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitItem();
    }
  });
  closeOnBackdropClick(addItemModal, closeAddItemModal);

  confirmDeleteBtn.addEventListener("click", confirmDelete);
  cancelDeleteBtn.addEventListener("click", cancelDelete);
  closeOnBackdropClick(confirmDeleteModal, cancelDelete);
}


