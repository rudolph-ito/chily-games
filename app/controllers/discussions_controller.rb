class DiscussionsController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
  before_filter :build_discussion, only: [:new, :create]
  before_filter :get_discussion, only: [:show, :edit, :update, :destroy]
  before_filter :authorize, except: [:index, :show]

  def index
    @discussions = Discussion.all
  end

  def new
  end

  def create
    save "new"
  end

  def show
  end

  def edit
  end

  def update
    save "edit"
  end

  def destroy
    @discussion.destroy
    redirect_to :discussions
  end

  protected

  def build_discussion
    @discussion = Discussion.new
  end

  def get_discussion
    @discussion = Discussion.find(params[:id])
  end

  def authorize
    authorize_action_for @discussion
  end

  def discussion_params
    params.require(:discussion).permit(:title, :description)
  end

  def save render_on_failure
    if @discussion.update_attributes(discussion_params)
      redirect_to @discussion
    else
      render render_on_failure
    end
  end
end
