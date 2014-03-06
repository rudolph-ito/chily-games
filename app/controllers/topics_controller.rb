class TopicsController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
  before_filter :build_topic, only: [:new, :create]
  before_filter :get_topic, only: [:show, :edit, :update, :destroy]
  before_filter :authorize, except: [:index, :show]

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
    @topic.destroy
    redirect_to :topics
  end

  protected

  def build_topic
    discussion = Discussion.find(params[:discussion_id])
    @topic = Topic.new(discussion: discussion, user: current_user)
  end

  def get_topic
    @topic = Topic.find(params[:id])
  end

  def authorize
    authorize_action_for @topic
  end

  def topic_params
    params.require(:topic).permit(
      :name,
      :board_type, :board_size, :board_rows, :board_columns
    )
  end

  def save render_on_failure
    if @topic.update_attributes(topic_params)
      redirect_to @topic
    else
      render render_on_failure
    end
  end
end
