require 'spec_helper'

describe 'admin terrain types' do
  before do
    sign_in_admin
  end

  describe 'index' do
    before { create_list :terrain_type, 3 }

    it 'succeeds' do
      get '/admin/terrain_types'
      expect(response.status).to eql 200
    end
  end

  describe 'new' do
    it 'succeeds' do
      get '/admin/terrain_types/new'
      expect(response.status).to eql 200
    end
  end

  describe 'create' do
    let(:valid_attributes) { {
      name: 'test',
      image: Rack::Test::UploadedFile.new('spec/support/fake_image.svg')
    } }

    it 'creates and redirects' do
      expect {
        post '/admin/terrain_types', terrain_type: valid_attributes
        expect(response).to redirect_to [:admin, TerrainType.last]
      }.to change(TerrainType, :count).by(1)
    end
  end

  describe 'edit' do
    let(:terrain_type) { create :terrain_type }

    it 'succeeds' do
      get "/admin/terrain_types/#{terrain_type.id}/edit"
      expect(response.status).to eql 200
    end
  end

  describe 'update' do
    let(:terrain_type) { create :terrain_type, name: 'old' }

    it 'updates and redirects to terrain_type' do
      put "/admin/terrain_types/#{terrain_type.id}", terrain_type: { name: 'new' }
      expect(terrain_type.reload.name).to eql 'new'
      expect(response).to redirect_to [:admin, terrain_type]
    end
  end

  describe 'destroy' do
    let!(:terrain_type) { create :terrain_type }

    it 'destroys and redirects to terrain_types' do
      expect{
        delete "/admin/terrain_types/#{terrain_type.id}"
        expect(response).to redirect_to [:admin, :terrain_types]
      }.to change(TerrainType, :count).by(-1)
    end
  end
end
