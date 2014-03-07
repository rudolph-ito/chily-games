require 'spec_helper'

describe PieceTypesController do
  describe 'index' do
    it 'succeeds' do
      get :index
      response.status.should == 200
    end
  end
end
