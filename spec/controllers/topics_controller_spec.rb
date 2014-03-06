require 'spec_helper'

describe TopicsController do
  let(:discussion) { create(:discussion) }

  describe 'new' do
    context 'when signed in', :signed_in do
      it 'succeeds' do
        get :new, discussion_id: discussion.id
        response.status.should == 200
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :new, discussion_id: discussion.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'create' do
    let(:valid_attributes) { {
      title: 'title', comments_attributes: [{text: 'comment'}]
    } }

    context 'when signed in', :signed_in do
      context 'with valid attributes' do
        it 'creates and redirects' do
          expect {
            post :create, discussion_id: discussion.id, topic: valid_attributes
            response.should redirect_to Topic.last
          }.to change(Topic, :count).by(1)
        end
      end

      context 'with invalid attributes' do
        it 'does not create and renders new' do
          expect {
            post :create, discussion_id: discussion.id, topic: valid_attributes.merge(title: '')
            response.should render_template 'new'
          }.to change(Topic, :count).by(0)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect {
          post :create, discussion_id: discussion.id, topic: valid_attributes
          response.should redirect_to new_user_session_path
        }.to change(Topic, :count).by(0)
      end
    end
  end

  describe 'show' do
    let(:topic) { create :topic }

    it 'succeeds' do
      get :show, id: topic.id
      response.status.should == 200
    end
  end

  describe 'edit' do
    let(:topic) { create :topic }

    context 'when signed in', :signed_in do
      context 'for own topic' do
        let(:topic) { create :topic, user: current_user }

        it 'succeeds' do
          get :edit, id: topic.id
          response.status.should == 200
        end
      end

      context 'for other topic' do
        it 'redirects to root' do
          get :edit, id: topic.id
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        get :edit, id: topic.id
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'update' do
    let(:topic) { create :topic, title: 'old' }

    context 'when signed in', :signed_in do
      context 'for own topic' do
        let(:topic) { create :topic, title: 'old', user: current_user }

        context 'with valid attributes' do
          it 'updates and redirects to topic' do
            put :update, id: topic.id, topic: { title: 'new' }
            topic.reload.title.should == 'new'
            response.should redirect_to topic
          end
        end

        context 'with invalid attributes' do
          it 'renders edit' do
            put :update, id: topic.id, topic: { title: '' }
            topic.reload.title.should == 'old'
            response.should render_template 'edit'
          end
        end
      end

      context 'for other topic' do
        it 'redirects to root' do
          put :update, id: topic.id, topic: { title: 'new' }
          topic.reload.title.should == 'old'
          response.should redirect_to root_path
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        put :update, id: topic.id, topic: { title: 'new' }
        topic.reload.title.should == 'old'
        response.should redirect_to new_user_session_path
      end
    end
  end

  describe 'destroy' do
    let!(:topic) { create :topic }

    context 'when signed in', :signed_in do
      context 'for own topic' do
        let!(:topic) { create :topic, user: current_user }

        it 'destroys and redirects to topics' do
          expect{
            delete :destroy, id: topic.id
            response.should redirect_to topic.parent
          }.to change(Topic, :count).by(-1)
        end
      end

      context 'for other topic' do
        it 'redirects to root_path' do
          expect{
            delete :destroy, id: topic.id
            response.should redirect_to root_path
          }.to_not change(Topic, :count)
        end
      end
    end

    context 'when not signed in' do
      it 'redirects to login' do
        expect{
          delete :destroy, id: topic.id
          response.should redirect_to new_user_session_path
        }.to_not change(Topic, :count)
      end
    end
  end
end
