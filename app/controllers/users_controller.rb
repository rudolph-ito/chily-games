class UsersController < ApplicationController
  before_filter :authenticate_user!, except: [:index, :show]
  before_filter :build_user, only: [:new, :create]
  before_filter :get_user, only: [:show, :edit, :update, :destroy]
  before_filter :authorize, except: [:index, :show]

  def index
    @users = User.all
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
    if params[:user][:password].blank? && params[:user][:password_confirmation].blank?
      params[:user].delete(:password)
      params[:user].delete(:password_confirmation)
    end
    save "edit"
  end

  def destroy
    @user.destroy
    redirect_to (@user == current_user ? [:new, :user, :session] : :users)
  end

  protected

  def build_user
    @user = User.new
  end

  def get_user
    @user = User.find(params[:id])
  end

  def authorize
    authorize_action_for @user
  end

  def user_params
    params.require(:user).permit(
      :username, :email,
      :password, :password_confirmation
    )
  end

  def save render_on_failure
    if @user.update_attributes(user_params)
      redirect_to @user
    else
      render render_on_failure
    end
  end
end
