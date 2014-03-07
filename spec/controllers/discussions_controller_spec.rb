require 'spec_helper'

describe DiscussionsController do
  describe 'show' do
    let(:discussion) { create :discussion }

    it 'succeeds' do
      get :show, id: discussion.id
      response.status.should == 200
    end
  end
end
