require 'spec_helper'

describe PieceTypesController do
  describe 'index' do
    it 'succeeds' do
      get :index
      expect(response.status).to eql 200
    end
  end
end
