require 'spec_helper'

describe 'admin terrain types' do
  before do
    sign_in admin: true
  end

  describe 'index' do
    before { create_list :terrain_type, 3 }

    it 'succeeds' do
      visit admin_terrain_types_path
    end
  end

  describe 'new/create' do
    it 'creates and redirects' do
      visit new_admin_terrain_type_path

      fill_in 'Name', with: 'test'
      attach_file 'Image', Rails.root.join('spec/support/fake_image.svg')
      click_on 'Create'

      expect(page).to have_content 'Terrain type was successfully created.'
    end
  end

  describe 'show/edit/update' do
    let(:terrain_type) { create :terrain_type, name: 'old' }

    it 'updates and redirects' do
      visit admin_terrain_type_path(terrain_type)
      click_on 'Edit Terrain Type'

      fill_in 'Name', with: 'new'
      click_on 'Update'

      expect(page).to have_content 'new'
      expect(page).to_not have_content 'old'
      expect(page).to have_content 'Terrain type was successfully updated.'
    end
  end

  describe 'destroy' do
    let(:terrain_type) { create :terrain_type }

    it 'succeeds' do
      visit admin_terrain_type_path(terrain_type)
      click_on 'Delete Terrain Type'
      page.driver.browser.switch_to.alert.accept

      expect(page).to have_content 'Terrain type was successfully destroyed.'
    end
  end
end
