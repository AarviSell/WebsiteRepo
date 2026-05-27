type HomePageSceneModule = typeof import('@/pages/HomePageScene');
type CategoryPageSceneModule = typeof import('@/pages/CategoryPageScene');

let homePageSceneModule: HomePageSceneModule | null = null;
let homePageScenePromise: Promise<HomePageSceneModule> | null = null;
let categoryPageSceneModule: CategoryPageSceneModule | null = null;
let categoryPageScenePromise: Promise<CategoryPageSceneModule> | null = null;

export function preloadHomePageScene() {
  if (!homePageScenePromise) {
    homePageScenePromise = import('@/pages/HomePageScene')
      .then(module => {
        homePageSceneModule = module;
        return module;
      })
      .catch(error => {
        homePageScenePromise = null;
        throw error;
      });
  }
  return homePageScenePromise;
}

export function preloadCategoryPageScene() {
  if (!categoryPageScenePromise) {
    categoryPageScenePromise = import('@/pages/CategoryPageScene')
      .then(module => {
        categoryPageSceneModule = module;
        return module;
      })
      .catch(error => {
        categoryPageScenePromise = null;
        throw error;
      });
  }
  return categoryPageScenePromise;
}

export function preloadInteractiveExperience() {
  return Promise.all([preloadHomePageScene(), preloadCategoryPageScene()]);
}

export function getHomePageSceneComponent() {
  return homePageSceneModule?.HomePageScene ?? null;
}

export function getCategoryPageSceneComponent() {
  return categoryPageSceneModule?.CategoryPageScene ?? null;
}