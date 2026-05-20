import { shopBtn, shopModal, shopCloseBtn, closeOnBackdropClick } from "../shared/dom.js";
import { ICON_COMPANION, ICON_PLAY, ICON_SOUND, ICON_COIN } from "../shared/icons.js";
import { AssetCategory, ShopData, Asset } from "../shared/types.js";
import { showToast } from "../shared/toast.js";

const CATEGORY_LABEL: Record<AssetCategory | 'all', string> = {
    all: 'All',
    sound: 'Sounds',
    companion: 'Companion',
};

const CATEGORY_ICON: Record<AssetCategory, string> = {
    sound: ICON_SOUND,
    companion: ICON_COMPANION
}

let shopData: ShopData | null = null;
let activeCategory: AssetCategory | 'all' = 'all';
let activeAudio: HTMLAudioElement | null = null;

// -----Coins-----

export function renderCoinBalance(coins: number): void {
    const container = document.getElementById('shop-coin-balance');
    if (!container) return;

    container.innerHTML = '';
    container.appendChild(buildCoinBalance(coins));
}

function buildCoinBalance(coins: number): HTMLElement {
    const badge = document.createElement('div');
    badge.className = 'coin-balance';

    const icon = document.createElement('span');
    icon.className = 'coin-balance__icon';
    icon.innerHTML = ICON_COIN;

    const amount = document.createElement('span');
    amount.className = 'coin-balance__amount';
    amount.textContent = `${coins}`;

    badge.appendChild(icon);
    badge.appendChild(amount);
    return badge;
}

//-----Category Tabs-----

export function renderCategoryTabs(
    categories: AssetCategory[],
    activeCategory: AssetCategory | 'all',
    onSelect: (category: AssetCategory | 'all') => void
): void {
    const nav = document.getElementById('shop-modal-tabs');
    if (!nav) return;

    nav.innerHTML = '';

    const allCategories: Array<AssetCategory | 'all'> = ['all', ...categories];
    allCategories.forEach(category => {
        nav.appendChild(buildTabButton(category, activeCategory, onSelect));
    });
}

function buildTabButton(
    category: AssetCategory | 'all',
    activeCategory: AssetCategory | 'all',
    onSelect: (category: AssetCategory | 'all') => void
): HTMLButtonElement {
    const isActive = category === activeCategory;

    const button = document.createElement('button');
    button.className = isActive
        ? 'shop-tab-btn shop-tab-btn--active'
        : 'shop-tab-btn';
    button.textContent = CATEGORY_LABEL[category];
    button.setAttribute('aria-pressed', String(isActive));
    button.addEventListener('click', () => onSelect(category));

    return button;
}

//-----Shop Grid-----

export function renderShopGrid(
    assets: Asset[],
    userCoins: number,
    buyAsset: (assetId: string) => void,
    playPreviewSound: (assetUrl: string) => void
): void {
    const grid = document.getElementById('shop-modal-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (assets.length === 0) {
        grid.appendChild(buildEmptyState());
        return;
    }

    assets.forEach(asset => {
        grid.appendChild(buildAssetCard(asset, userCoins, buyAsset, playPreviewSound));
    });
}

//-----Asset Card-----

function buildAssetCard(
    asset: Asset,
    userCoins: number,
    buyAsset: (assetId: string) => void,
    playPreviewSound: (assetUrl: string) => void
): HTMLElement {
    const isAffordable = userCoins >= asset.price;

    const card = document.createElement('article');
    card.className = buildAssetCardClassName(asset, isAffordable);
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', asset.name);

    card.appendChild(buildAssetCardPreview(asset, playPreviewSound));
    card.appendChild(buildAssetCardFooter(asset, isAffordable, buyAsset));

    return card;
}

function buildAssetCardClassName(asset: Asset, isAffordable: boolean): string {
    const base = 'asset-card';
    if (asset.isOwned) return `${base} ${base}--owned`;
    if (!isAffordable) return `${base} ${base}--unaffordable`;
    return base;
}

function buildAssetCardPreview(
    asset: Asset,
    playPreviewSound: (assetUrl: string) => void
): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'asset-card__preview';

    preview.appendChild(buildAssetIcon(asset));

    if (asset.category === 'sound') {
        preview.appendChild(buildPreviewButton(asset, playPreviewSound));
    }

    return preview;
}

function buildAssetIcon(asset: Asset): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'asset-card__icon';
    wrapper.innerHTML = CATEGORY_ICON[asset.category];
    return wrapper;
}

function buildPreviewButton(
    asset: Asset,
    playPreviewSound: (assetUrl: string) => void
): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'asset-card__preview-btn';
    button.setAttribute('aria-label', `${asset.name} anhören`);
    button.innerHTML = ICON_PLAY;

    button.addEventListener('click', (event) => {
        event.stopPropagation();
        playPreviewSound(asset.assetUrl);
    });

    return button;
}

function buildAssetCardFooter(
    asset: Asset,
    isAffordable: boolean,
    buyAsset: (assetId: string) => void
): HTMLElement {
    const footer = document.createElement('footer');
    footer.className = 'asset-card__footer';

    const name = document.createElement('span');
    name.className = 'asset-card__name';
    name.textContent = asset.name;

    footer.appendChild(name);
    footer.appendChild(buildBuyButton(asset, isAffordable, buyAsset));

    return footer;
}

function buildBuyButton(
    asset: Asset,
    isAffordable: boolean,
    buyAsset: (assetId: string) => void
): HTMLButtonElement {
    const button = document.createElement('button');

    if (asset.isOwned) {
        button.className = 'asset-buy-btn asset-buy-btn--owned';
        button.textContent = 'Owned';
        button.disabled = true;
        return button;
    }

    if (!isAffordable) {
        button.className = 'asset-buy-btn asset-buy-btn--unaffordable';
        button.textContent = `${asset.price}`;
        button.disabled = true;
        return button;
    }

    button.className = 'asset-buy-btn asset-buy-btn--buy';

    const coinIcon = document.createElement('span');
    coinIcon.className = 'asset-buy-btn__coin-icon';
    coinIcon.innerHTML = ICON_COIN;
    const price = document.createTextNode(`${asset.price}`);

    button.appendChild(coinIcon);
    button.appendChild(price);
    button.addEventListener('click', () => buyAsset(asset.id));

    return button;
}

//-----Empty State-----

function buildEmptyState(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'shop-empty-state';

    const message = document.createElement('p');
    message.className = 'shop-empty-state__message';
    message.textContent = 'Keine assets in dieser Kategorie.';

    wrapper.appendChild(message);
    return wrapper;
}


//-----Event Listener-----

export function initShop(): void {
    shopBtn.addEventListener('click', openShop);
    shopCloseBtn.addEventListener('click', closeShop);
    shopModal.addEventListener('cancel', closeShop);
    closeOnBackdropClick(shopModal, closeShop);
}

//-----Event Handler-----

async function openShop(): Promise<void> {
    shopModal.showModal();
    document.body.style.overflow = 'hidden';
    await loadAndRender();
}

function closeShop(): void {
    shopModal.close();
    document.body.style.overflow = '';
    stopAudioPreview();
}

async function buyAsset(assetId: string): Promise<void> {
    if (!shopData) return;
    const purchasedAsset = shopData.assets.find(asset => asset.id === assetId);
    if (!purchasedAsset) return;

    try {
        await purchaseAsset(assetId);
        purchasedAsset.isOwned = true;
        shopData.userCoins -= purchasedAsset.price;
        rerender();
    } catch {
        showToast({
            type: "error",
            message: "Kauf fehlgeschlagen. Bitte versuche es erneut."
        });
    }
}

function previewSound(assetUrl: string): void {
    stopAudioPreview();
    activeAudio = new Audio(assetUrl);
    activeAudio.play();
    activeAudio.play().catch(() => {
        showToast({
            type: "error",
            message: "Sound konnte nicht abgespielt werden."
        })
    })
}

//-----Data & Rendering-----

async function loadAndRender(): Promise<void> {
    const userId = getCurrentUserId();
    shopData = await fetchShopData(userId);
    activeCategory = 'all';
    rerender();
}

function rerender(): void {
    if (!shopData) return;

    const filteredItems = filterByCategory(shopData.assets, activeCategory);
    const uniqueCategories = extractUniqueCategories(shopData.assets);

    renderCoinBalance(shopData.userCoins);
    renderCategoryTabs(uniqueCategories, activeCategory, selectCategory);
    renderShopGrid(filteredItems, shopData.userCoins, buyAsset, previewSound);
}

function selectCategory(category: AssetCategory | 'all'): void {
    activeCategory = category;
    rerender();
}

//-----Helpers-----

function filterByCategory(
    assets: Asset[],
    category: AssetCategory | 'all'
): Asset[] {
    if (category === 'all') return assets;
    return assets.filter(asset => asset.category === category);
}

function extractUniqueCategories(assets: Asset[]): AssetCategory[] {
    return [...new Set(assets.map(asset => asset.category))];
}

function stopAudioPreview(): void {
    if (!activeAudio) return;
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
}

//-----Placeholder-----

function getCurrentUserId(): string {
    throw new Error('getCurrentUserId() not implemented — connect to auth service');
}

async function fetchShopData(_userId: string): Promise<ShopData> {
    throw new Error('fetchShopData() not implemented — connect to shop.service.ts');
}

async function purchaseAsset(_assetId: string): Promise<void> {
    throw new Error('purchaseItem() not implemented — connect to shop.service.ts');
}
