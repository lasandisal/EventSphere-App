// =========================================================
// EventSphere — Admin Categories Module
// =========================================================

let categoriesMap = {};

// Load System Categories
async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  try {
    const response = await CategoriesAPI.getAll();
    const list = Array.isArray(response) ? response : (response?.data || response?.content || []);

    if (!list.length) {
      if (grid) grid.innerHTML = `<div class="col-12 text-center text-muted-soft py-4">No categories found</div>`;
      return;
    }

    categoriesMap = {};
    list.forEach(c => categoriesMap[c.id] = c);

    if (grid) {
      grid.innerHTML = list.map(c => {
        const displayIcon = c.icon || c.emoji || '🏷️';
        const displayDesc = c.description || 'No description provided';
        
        return `
        <div class="col-12 col-sm-6 col-md-4 col-xl-3">
          <div class="category-card p-3 rounded-3 shadow-sm h-100 d-flex flex-column justify-content-between text-start ${c.cls || ''}" 
               style="cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;"
               ondblclick="editCategory(${c.id})"
               title="Double-click to edit">
            
            <div>
              <div class="text-center mb-2">
                <div class="cat-icon fs-3 mb-1">${displayIcon}</div>
                <h6 class="cat-name fw-bold mb-0 text-break">${c.name}</h6>
              </div>
              
              <p class="text-muted-soft small mb-3 text-start" 
                 style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.45; min-height: 3.2em;">
                ${displayDesc}
              </p>
            </div>

            <div class="d-flex gap-2 pt-2 border-top">
              <button type="button" class="btn btn-quiet btn-sm flex-grow-1" onclick="event.stopPropagation(); editCategory(${c.id})">
                <i class="bi bi-pencil me-1"></i>Edit
              </button>
              <button type="button" class="btn btn-danger-soft btn-sm" onclick="event.stopPropagation(); deleteCategory(${c.id})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>`;
      }).join('');
    }
  } catch (e) {
    console.error('Failed to load categories:', e);
    if (grid) grid.innerHTML = `<div class="col-12 text-center text-muted-soft py-4">Error loading categories</div>`;
  }
}

async function deleteCategory(id) {
  const category = categoriesMap[id];
  const name = category ? `"${category.name}"` : 'this category';

  if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
    return;
  }

  try {
    await CategoriesAPI.remove(id);
    esToast('Category deleted successfully');
    loadCategories();
  } catch (err) {
    esToast(err.message || 'Failed to delete category', 'error');
  }
}

// Open modal for ADD Category
document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
  document.getElementById('categoryForm')?.reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryModalLabel').innerText = 'Add New Category';
  document.getElementById('saveCategoryBtn').innerText = 'Save Category';

  const modalEl = document.getElementById('categoryModal');
  if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
});

// Open modal for EDIT Category
function editCategory(id) {
  const category = categoriesMap[id];
  if (!category) return;

  document.getElementById('categoryId').value = category.id;
  document.getElementById('categoryName').value = category.name || '';
  document.getElementById('categoryIcon').value = category.icon || category.emoji || '';
  document.getElementById('categoryDescription').value = category.description || '';

  document.getElementById('categoryModalLabel').innerText = 'Edit Category';
  document.getElementById('saveCategoryBtn').innerText = 'Update Category';

  const modalEl = document.getElementById('categoryModal');
  if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

// Submit Form (Create or Update)
document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('categoryId').value;
  const saveBtn = document.getElementById('saveCategoryBtn');
  const originalText = saveBtn.innerText;

  const rawIcon = document.getElementById('categoryIcon').value.trim();

  const payload = {
    name: document.getElementById('categoryName').value.trim(),
    icon: rawIcon || '🏷️',
    emoji: rawIcon || '🏷️',
    description: document.getElementById('categoryDescription').value.trim()
  };

  try {
    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';

    if (id) {
      await CategoriesAPI.update(id, payload);
      esToast('Category updated successfully');
    } else {
      await CategoriesAPI.create(payload);
      esToast('Category added successfully');
    }

    const modalEl = document.getElementById('categoryModal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    loadCategories();
  } catch (err) {
    esToast(err.message || 'Failed to save category', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = originalText;
  }
});
