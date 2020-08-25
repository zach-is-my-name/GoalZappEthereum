import React, {Component} from 'react';
import {connect} from 'react-redux';
import {graphql, compose, withApollo} from 'react-apollo';
import gql from 'graphql-tag';

const removeStepMutation = gql `mutation removeStepMutation($id: ID)  {
  stepDelete(data: {id: $id}) {
    success
  }
}
`
const suggestMoveMutation = gql `
  mutation SuggestMoveStep($id: ID!) {
    clonedStepUpdate(data: {
      id: $id,
      suggestedStep: false,
      suggestMove: false,
    }){
      id
      positionIndex
      stepsId
      suggestedStep
      step
    }
  }
`

const clonedStepsQuery = gql `
query clonedStepQuery($id: ID) {
  clonedStepsList(filter: {clonedStepsOfGoalDoc: {id: {equals: $id}}}, sort: {positionIndex: ASC}) {
    items {
      positionIndex
      step
      suggestedStep
      id
    }
  }
}
`
const stepsQuery = gql `
query stepsQuery($id: ID) {
  stepsList(filter: {stepsOfGoalDoc: {id: {equals: $id}}}, sort: {positionIndex: ASC}) {
    items {
      id
      positionIndex
      step
      suggestedStep
    }
  }
}
`

const removeClonedStepMutation = gql `mutation removeClonedStepMutation($id: ID)  {
  clonedStepDelete(data: {id: $id}) {
    success
  }
}
`
const updateClonedStep = gql ` mutation updateClonedStep(
  $id: ID!,
  $suggestedStep: Boolean,
  $positionIndex: Int,
  $stepsId: String,
) {
  clonedStepUpdate(data: {
    id: $id,
    positionIndex: $positionIndex,
    stepsId: $stepsId,
    suggestedStep: $suggestedStep
  }) {
    id
    positionIndex
    stepsId
    suggestedStep
    step
  }
}
`

const createStep = gql `
mutation createStep(
  $goalDocId: ID,
  $step: String!,
  $positionIndex: Int,
) {
  stepCreate(data: {
    step: $step,
    stepsOfGoalDoc: {connect: {id: $goalDocId}},
    positionIndex: $positionIndex,
    suggestedStep: false}) {
    step,
    id,
    stepsOfGoalDoc {
      id
    }
  }
}
`
const updateStep = gql `
mutation updateStep(
  $id: ID!,
  $positionIndex: Int
) {
  stepUpdate(data: {
    id: $id,
    positionIndex: $positionIndex,
  }) {
    id
    positionIndex
    suggestedStep
    step
  }
}
`
const goalDocByIdQuery = gql `query GoalDocByIdQuery ($goalDocId: ID) {
  goalDoc(id: $goalDocId) {
   goal
   id
   steps(orderBy:positionIndex_ASC) {
     items {
     step
     positionIndex
     suggestedStep
     id
    }}
   clonedSteps(orderBy:positionIndex_ASC) {
     items {
     positionIndex
     id
     suggestedStep
     stepsId
     suggester {
       id
       userName
     }
    }
   }
  }
}`

class AcceptNonPaybaleStep extends Component {
  constructor(props) {
    super(props)
    this._submitAcceptNonPaybleStep = this._submitAcceptNonPaybleStep.bind(this)
    this._submitAcceptNonPaybleStepMutation = this._submitAcceptNonPaybleStepMutation.bind(this)  }

  componentDidMount() {
    this.props.unrenderAcceptStepFunction()
    // console.log('acceptNonPayable called')
  }

  render() {
        this._submitAcceptNonPaybleStep()
        return null
  }

  _submitAcceptNonPaybleStep =  async () => {
      const result = await this._submitAcceptNonPaybleStepMutation()
  }

  _submitAcceptNonPaybleStepMutation = async () => {
      // console.log(this.props)
      switch (this.props.stepObj.suggestRemove
       || this.props.stepObj.suggestMove
       || this.props.stepObj.suggestEdit) {

     case this.props.stepObj.suggestRemove:
        await this._acceptStepSuggestRemove();
        break;

     case this.props.stepObj.suggestMove:
      this._acceptStepSuggestMove();
      break;

     case this.props.stepObj.suggestEdit:
      this._acceptStepSuggestEdit();
      break;
    }
  }

 _acceptStepSuggestRemove = async () => {
        const {stepObj} = this.props
        let reorderedClonedSteps, reorderedSteps, clonedStepsQueryResult, stepsQueryResult
        let suggestRemoveClonedStepId = stepObj.id
        let suggestRemoveStepId = stepObj.stepsId

        const _reorderSteps = (queryResult, stepType) => {
          if (stepType === "clonedStep") {
            // console.log("CLONEDSTEP queryResult: ", queryResult)
            // console.log("CLONEDSTEP queryResult LONG: ", queryResult.data.clonedStepsLi)
            //
            // console.log("CLONEDSTEP  queryResult.data.clonedStepslist.items.map((stepObj, index) => ({...stepObj, positionIndex: index }))")
          return queryResult.data.clonedStepsList.items.map((stepObj, index) => ({...stepObj, positionIndex: index }))
        } else {
          // console.log("STEP queryResult ", queryResult)
          // console.log("STEP  queryResult.data.stepslist.items.map((stepObj, index) => ({...stepObj, positionIndex: index }))")
          return queryResult.data.stepsList.items.map((stepObj, index) => ({...stepObj, positionIndex: index }))
        }
        }

      try {
        await this.props.removeClonedStepMutation({
          variables: {
            id: suggestRemoveClonedStepId
          }
        })
      /*  .then( (result)=> console.log('remove clonedStep result',result)) */
        await this.props.removeStepMutation({
          variables: {
            id: suggestRemoveStepId
          }
        })
      /*  .then(result=> console.log('/*remove step result',result)) */
    } catch (error) {
      console.log(error)
    }
      try {
        clonedStepsQueryResult = await this.props.client.query({query: clonedStepsQuery,
          variables: {
            goalDocId: this.props.goalDocId},
            fetchPolicy: 'network-only'})
          } catch(error) {
                console.log(error)
          }

        try {
          reorderedClonedSteps = await _reorderSteps(clonedStepsQueryResult, "clonedStep")
          await reorderedClonedSteps.map(async(stepObj, mapIndex) => {
            await this.props.updateClonedStep({
              variables: {
                id: stepObj.id,
                positionIndex: stepObj.positionIndex
              }
            })
          })
          } catch(error) {
                console.log(error)
            }
      try {
        stepsQueryResult = await this.props.client.query({query: stepsQuery,
          variables: {
            goalDocId: this.props.goalDocId},
            fetchPolicy: 'network-only'})
          } catch(error) {
                console.log(error)
          }

        try {
        reorderedSteps = await _reorderSteps(stepsQueryResult, "step")
        await reorderedSteps.map(async(stepObj, mapIndex) => {
          await this.props.updateStep({
            variables: {
              id: stepObj.id,
              positionIndex: stepObj.positionIndex
            }
          })
        })
          } catch(error) {
                console.log(error)
            }
      }

  _acceptStepSuggestMove = async () => {
    let stepIdQueryResult
    try {
         stepIdQueryResult  = await this.props.client.query({
           query: stepsQuery, variables : { id: this.props.goalDocId},
             fetchPolicy: 'network-only'
           })
      } catch (error) {
        console.log(error)
      }

    await this.props.updateClonedStep( {
      variables: {
        id: this.props.clonedStepId,
        suggestMove: false
      }
    })

  const _reorderSteps = () => {
    let oldSteps = this.props.steps
    let indexToDelete= oldSteps.findIndex(stepObj => stepObj.id === this.props.stepsId)

    let targetStep = oldSteps.splice(indexToDelete, 1)

    oldSteps.splice(this.props.clonedStepIndex, 0, targetStep)


    const newSteps = oldSteps.map((stepObj, index) => ({
      ...stepObj,
      positionIndex: index
    }))

    return newSteps
  }

  const _submitMoveStepMutation = async (newStepsSortedByPositionIndex) => {
    newStepsSortedByPositionIndex.map(async stepObj => {
      const updateStepResult = await this.props.updateStep({
        variables: {
          id: stepObj.id,
          positionIndex: stepObj.positionIndex
        }
      }).catch(error => console.log(error))
    })
  }

  await _submitMoveStepMutation(_reorderSteps(stepIdQueryResult))
  }

  _acceptStepSuggestEdit = async () => {
        try {
          const clonedStepId = this.props.stepObj.id
          const stepsId = this.props.stepObj.stepsId
          const step = this.props.stepObj.step

          await this.props.updateStep(
            { variables: {
              id: stepsId,
              step: step
            }}
          )
          await this.props.updateClonedStep(
            { variables: {
            id: clonedStepId,
            suggestedStep: false
            }}
         )
        } catch (error) {
          console.log(error)
        }
      }
      }


const componentWithGrapQL  = compose(
  graphql(createStep, {
  name: 'createStep',
  props: ({createStep}) => ({
    createStep({variables}) {
      console.log(variables)
      return createStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery'],
        errorPolicy: 'all'
      }).catch((error) => {
        console.log('there was an error sending the query', error)
      })
    }
  }),
}),
graphql(updateClonedStep, {
  name: 'updateClonedStep',
  props: ({updateClonedStep}) => ({
    updateClonedStep({variables}) {
      return updateClonedStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery'],
      }).catch((error) => {
        console.log(error)
      })
    }
  })
}),
graphql(updateStep, {
  name: 'updateStep',
  props: ({updateStep}) => ({
    updateStep({variables}) {
      return updateStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery'],
      }).catch((error) => {
        console.log(error)
      })
    }
  })
}),
graphql(removeClonedStepMutation, {
  name: 'removeClonedStepMutation',
  props: ({removeClonedStepMutation}) => ({
    removeClonedStepMutation({variables}) {
      return removeClonedStepMutation({
        variables: {
          ...variables
        },
        refetchQueries: [`goalDocByIdQuery`]
      }).catch((error) => {
        console.log(error)
      })
    }
  })
}),
graphql(removeStepMutation, {
  name: 'removeStepMutation',
  props: ({removeStepMutation}) => ({
    removeStepMutation({variables}) {
      return removeStepMutation({
        variables: {
          ...variables
        },
        refetchQueries: [`goalDocByIdQuery`]
      }).catch((error) => {
        console.log(error)
      })
    }
  })
}),withApollo)(AcceptNonPaybaleStep)
export default componentWithGrapQL
