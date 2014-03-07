require 'spec_helper'

describe TerrainTypesController do
  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end
end
