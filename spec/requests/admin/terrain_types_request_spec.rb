require 'spec_helper'

describe 'admin terrain types' do
  before do
    sign_in_admin
  end

  describe 'index' do
    before { create_list :terrain_type, 3 }

    it 'succeeds' do
      get '/admin/terrain_types'
      response.status.should == 200
    end
  end

  describe 'new' do
    it 'succeeds' do
      get '/admin/terrain_types/new'
      response.status.should == 200
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
        response.should redirect_to [:admin, TerrainType.last]
      }.to change(TerrainType, :count).by(1)
    end
  end

  describe 'edit' do
    let(:terrain_type) { create :terrain_type }

    it 'succeeds' do
      get "/admin/terrain_types/#{terrain_type.id}/edit"
      response.status.should == 200
    end
  end

  describe 'update' do
    let(:terrain_type) { create :terrain_type, name: 'old' }

    it 'updates and redirects to terrain_type' do
      put "/admin/terrain_types/#{terrain_type.id}", terrain_type: { name: 'new' }
      terrain_type.reload.name.should == 'new'
      response.should redirect_to [:admin, terrain_type]
    end
  end

  describe 'destroy' do
    let!(:terrain_type) { create :terrain_type }

    it 'destroys and redirects to terrain_types' do
      expect{
        delete "/admin/terrain_types/#{terrain_type.id}"
        response.should redirect_to [:admin, :terrain_types]
      }.to change(TerrainType, :count).by(-1)
    end
  end
end
